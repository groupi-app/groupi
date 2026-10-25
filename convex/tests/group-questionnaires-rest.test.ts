import { expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function actor(
  t: ReturnType<typeof createTestInstance>,
  username: string,
  permissions?: Record<string, string[]>
) {
  const account = await createAuthAccount(t, username);
  const rawKey = `grp_groups_${username}`;
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    },
  });
  return {
    ...account,
    request: (path: string, method = 'GET', body?: unknown) =>
      t.fetch(`/api/v2${path}`, {
        method,
        headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}

it('configures a private optional form and serves bounded author and manager history over REST', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'q-rest-owner'),
    member = await actor(t, 'q-rest-member'),
    other = await actor(t, 'q-rest-other');
  const { groupId } = await body(
    await owner.request('/groups', 'POST', { name: 'Readers' }),
    201
  );
  const base = `/groups/${groupId}/joining-questionnaire`;
  await body(
    await owner.request(base, 'PUT', {
      enabled: true,
      questions: [
        {
          id: 'name',
          label: 'Preferred name',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    })
  );
  await body(await other.request(base), 403);
  const sent = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: sent.inviteId,
  });
  const form = await body(await member.request(base));
  expect(form).toMatchObject({ shouldPrompt: true, canEdit: true });
  expect(form).not.toHaveProperty('history');
  await body(
    await member.request(base + '/answers', 'PUT', {
      version: form.version,
      answers: { name: 'Private answer' },
    })
  );
  const own = await body(await member.request(base + '/history?limit=1'));
  expect(own.items).toHaveLength(1);
  expect(own.items[0]).toMatchObject({
    question: { label: 'Preferred name', version: 1 },
    answer: 'Private answer',
  });
  await body(
    await other.request(base + '/history?authorId=' + member.personId),
    403
  );
  expect(
    (await body(await owner.request(base + '/responses?limit=1'))).items[0]
  ).toMatchObject({
    author: { personId: member.personId },
    answers: { name: 'Private answer' },
  });
  await body(await member.request(base + '/responses'), 403);
  await body(
    await member.request(base, 'PUT', { enabled: false, questions: [] }),
    403
  );
});

it('rechecks current roles and bans while retaining own private records after removal', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'q-role-owner'),
    mod = await actor(t, 'q-role-mod'),
    member = await actor(t, 'q-role-member');
  const { groupId } = await body(
    await owner.request('/groups', 'POST', { name: 'Private' }),
    201
  );
  const base = `/groups/${groupId}/joining-questionnaire`;
  await body(
    await owner.request(base, 'PUT', {
      enabled: true,
      questions: [{ id: 'yes', label: 'Yes?', type: 'YES_NO', required: true }],
    })
  );
  for (const person of [mod, member]) {
    const invite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: person.personId }
    );
    await person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
  }
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: mod.personId,
    role: 'MODERATOR',
  });
  const form = await body(await member.request(base));
  await body(
    await member.request(base + '/answers', 'PUT', {
      version: form.version,
      answers: { yes: false },
    })
  );
  expect(
    (await body(await mod.request(base + '/responses'))).items
  ).toHaveLength(1);
  await body(
    await mod.request(base, 'PUT', { enabled: false, questions: [] }),
    403
  );
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: mod.personId,
    role: 'MEMBER',
  });
  await body(await mod.request(base + '/responses'), 403);
  await body(
    await mod.request(base + '/history?authorId=' + member.personId),
    403
  );
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: member.personId,
  });
  expect(await body(await member.request(base))).toMatchObject({
    canEdit: false,
    answers: { yes: false },
  });
  await body(
    await member.request(base + '/answers', 'PUT', {
      version: form.version,
      answers: { yes: true },
    }),
    403
  );
  expect(
    (await body(await owner.request(base + '/responses'))).items[0]
  ).toMatchObject({ answers: { yes: false } });
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: mod.user._id }],
      update: { banned: true },
    },
  });
  await body(
    await mod.request(base + '/answers', 'PUT', {
      version: form.version,
      answers: { yes: true },
    }),
    401
  );
});

it('purges author records immediately through all three account deletion paths and deletes Group definitions', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'q-clean-owner'),
    admin = await actor(t, 'q-clean-admin');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  const { groupId } = await body(
    await owner.request('/groups', 'POST', { name: 'Cleanup' }),
    201
  );
  const base = `/groups/${groupId}/joining-questionnaire`;
  const form = await body(
    await owner.request(base, 'PUT', {
      enabled: true,
      questions: [
        {
          id: 'private',
          label: 'Private',
          required: true,
          type: 'SHORT_ANSWER',
        },
      ],
    })
  );
  for (const path of ['self', 'app', 'rest'] as const) {
    const target = await actor(t, 'q-clean-' + path);
    const invite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: target.personId }
    );
    await target.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
    await body(
      await target.request(base + '/answers', 'PUT', {
        version: form.version,
        answers: { private: 'Sensitive' },
      })
    );
    if (path === 'self')
      await target.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'q-clean-' + path,
      });
    else if (path === 'app')
      await admin.auth.mutation(api.admin.mutations.deletePerson, {
        personId: target.personId,
      });
    else
      await body(
        await admin.request('/admin/users/' + target.user._id, 'DELETE'),
        204
      );
    expect(
      (await body(await owner.request(base + '/responses'))).items
    ).toEqual([]);
    for (const table of [
      'groupQuestionnaireRecords',
      'groupQuestionnaireAnswers',
      'groupQuestionnaireHistory',
    ] as const)
      expect(await t.run(ctx => ctx.db.query(table).collect())).toEqual([]);
  }
  await body(await owner.request('/groups/' + groupId, 'DELETE'), 204);
  for (const table of [
    'groupQuestionnaires',
    'groupQuestionnaireIdentities',
  ] as const)
    expect(await t.run(ctx => ctx.db.query(table).collect())).toEqual([]);
});

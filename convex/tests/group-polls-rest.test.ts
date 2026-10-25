import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance as baseTestInstance } from './test_helpers';
const instances: ReturnType<typeof baseTestInstance>[] = [];
function createTestInstance() {
  const t = baseTestInstance();
  instances.push(t);
  return t;
}
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
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
        headers: {
          'x-api-key': rawKey,
          'content-type': 'application/json',
          'idempotency-key': `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}

const definition = {
  title: 'Next book',
  mode: 'SINGLE' as const,
  options: [
    { id: 'dune', label: 'Dune' },
    { id: 'earthsea', label: 'Earthsea' },
  ],
};
async function invite(
  owner: Awaited<ReturnType<typeof actor>>,
  member: Awaited<ReturnType<typeof actor>>,
  groupId: Parameters<
    typeof owner.auth.mutation<
      typeof api.groupInvites.mutations.sendGroupInvite
    >
  >[1]['groupId']
) {
  const sent = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: sent.inviteId,
  });
}
it('REST validates scopes, vote policy, stale edits/removal and private results without cross-Group tool access', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'poll-rest-owner'),
    member = await actor(t, 'poll-rest-member'),
    reader = await actor(t, 'poll-rest-reader', { groups: ['read'] });
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'REST polls',
  });
  await invite(owner, member, groupId);
  const path = `/groups/${groupId}/polls`;
  await body(
    await reader.request(path, 'POST', {
      ...definition,
      resultsVisibility: 'MANAGERS',
    }),
    403
  );
  await body(
    await member.request(path, 'POST', {
      ...definition,
      resultsVisibility: 'MANAGERS',
    }),
    403
  );
  await body(
    await owner.request(path, 'POST', {
      ...definition,
      options: [
        { id: 'a', label: 'A' },
        { id: 'a', label: 'B' },
      ],
      resultsVisibility: 'MANAGERS',
    }),
    400
  );
  const created = await body(
      await owner.request(path, 'POST', {
        ...definition,
        resultsVisibility: 'MANAGERS',
      }),
      201
    ),
    toolId = created.toolId;
  expect(await body(await member.request(`${path}/${toolId}`))).toMatchObject({
    mode: 'SINGLE',
    resultsVisibility: 'MANAGERS',
    voteRevision: 0,
  });
  await body(
    await member.request(`${path}/${toolId}/vote`, 'PUT', {
      version: 1,
      expectedRevision: 0,
      selections: ['dune', 'earthsea'],
    }),
    400
  );
  await body(
    await owner.request(`${path}/${toolId}`, 'PATCH', {
      ...definition,
      version: 1,
      resultsVisibility: 'MEMBERS',
    }),
    400
  );
  const input = { version: 1, expectedRevision: 0, selections: ['dune'] };
  expect(
    await body(await member.request(`${path}/${toolId}/vote`, 'PUT', input))
  ).toEqual({ revision: 1 });
  expect(
    await body(await member.request(`${path}/${toolId}/vote`, 'PUT', input))
  ).toEqual({ revision: 1 });
  await body(await member.request(`${path}/${toolId}/results`), 403);
  expect(
    (await body(await owner.request(`${path}/${toolId}/results`))).page
  ).toHaveLength(1);
  await body(
    await owner.request(`${path}/${toolId}`, 'PATCH', {
      ...definition,
      version: 1,
      title: 'Updated',
    }),
    204
  );
  await body(
    await member.request(`${path}/${toolId}/vote`, 'PUT', {
      ...input,
      selections: ['earthsea'],
    }),
    409
  );
  await body(
    await member.request(`${path}/${toolId}/vote`, 'DELETE', {
      expectedRevision: 0,
    }),
    409
  );
  const otherGroup = await owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Other' }
  );
  await body(await owner.request(`/groups/${otherGroup}/polls/${toolId}`), 404);
  await body(
    await owner.request(`/groups/${groupId}/poll-policy`, 'PUT', {
      enabled: false,
      creation: 'MANAGERS',
    })
  );
  expect(
    await body(await owner.request(`${path}/${toolId}/settings`))
  ).toMatchObject({ version: 2, canManage: true });
  await body(await member.request(`${path}/${toolId}/settings`), 403);
  await body(await owner.request(`${path}/${toolId}`), 403);
  await body(await owner.request(`${path}/${toolId}/results`), 403);
  expect(
    (await body(await member.request(`${path}/${toolId}/history`))).page[0]
      .options
  ).toEqual(definition.options);
  await body(
    await member.request(`${path}/${toolId}/vote`, 'DELETE', {
      expectedRevision: 1,
    }),
    204
  );
  expect(
    (await body(await member.request(`${path}/${toolId}/history`))).page
  ).toEqual([]);
  await body(await owner.request(`${path}/${toolId}`, 'DELETE'), 204);
  expect((await body(await owner.request(path))).page).toEqual([]);
});
it.each(['self', 'admin-session', 'admin-rest'] as const)(
  'purges private poll votes/history and retains anonymous shared latest through %s',
  async mode => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, `poll-clean-owner-${mode}`),
      author = await actor(t, `poll-clean-author-${mode}`),
      admin = await actor(t, `poll-clean-admin-${mode}`);
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Poll cleanup' }
    );
    await invite(owner, author, groupId);
    await owner.auth.mutation(api.groupTools.mutations.configurePollPolicy, {
      groupId,
      enabled: true,
      creation: 'MEMBERS',
    });
    const ids = [];
    for (const resultsVisibility of ['MANAGERS', 'MEMBERS'] as const) {
      const toolId = await author.auth.mutation(
        api.groupPolls.mutations.createPoll,
        { groupId, ...definition, resultsVisibility }
      );
      ids.push(toolId);
      await author.auth.mutation(api.groupPolls.mutations.submitVote, {
        toolId,
        version: 1,
        expectedRevision: 0,
        selections: ['dune'],
      });
      await author.auth.mutation(api.groupPolls.mutations.submitVote, {
        toolId,
        version: 1,
        expectedRevision: 1,
        selections: ['earthsea'],
      });
    }
    if (mode === 'self')
      await author.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: `poll-clean-author-${mode}`,
      });
    else if (mode === 'admin-session')
      await admin.auth.mutation(api.admin.mutations.deletePerson, {
        personId: author.personId,
      });
    else
      await body(
        await admin.request(`/admin/users/${author.user._id}`, 'DELETE'),
        204
      );
    const page = { numItems: 20, cursor: null };
    expect(
      (
        await owner.auth.query(api.groupPolls.queries.listResults, {
          toolId: ids[0],
          paginationOpts: page,
        })
      ).page
    ).toEqual([]);
    const shared = (
      await owner.auth.query(api.groupPolls.queries.listResults, {
        toolId: ids[1],
        paginationOpts: page,
      })
    ).page;
    expect(shared).toHaveLength(1);
    expect(shared[0]).toMatchObject({
      revision: 2,
      selections: ['earthsea'],
      isCurrent: true,
    });
    expect(shared[0].personId).toBeUndefined();
    for (const toolId of ids)
      expect(
        await owner.auth.query(api.groupPolls.queries.getPoll, { toolId })
      ).not.toHaveProperty('creatorId');
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupPollRevisions')
          .withIndex('by_personId', q => q.eq('personId', author.personId))
          .collect()
      )
    ).toEqual([]);
    expect(await t.run(ctx => ctx.db.query('notifications').collect())).toEqual(
      []
    );
    await owner.auth.mutation(api.groupPolls.mutations.removeResult, {
      voteId: shared[0]._id,
      expectedRevision: 2,
    });
    expect(
      (
        await owner.auth.query(api.groupPolls.queries.listResults, {
          toolId: ids[1],
          paginationOpts: page,
        })
      ).page[0]
    ).toMatchObject({ removed: true, isCurrent: false, selections: [] });
  }
);
it('Group retirement purges kind-specific poll data and forms independently', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'poll-retire-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Retire tools',
  });
  const pollId = await owner.auth.mutation(
    api.groupPolls.mutations.createPoll,
    { groupId, ...definition, resultsVisibility: 'MEMBERS' }
  );
  const formId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Still independent',
      questions: [],
      resultsVisibility: 'MANAGERS',
    }
  );
  await owner.auth.mutation(api.groupPolls.mutations.submitVote, {
    toolId: pollId,
    version: 1,
    expectedRevision: 0,
    selections: ['dune'],
  });
  await owner.auth.mutation(api.groupForms.mutations.submitResponse, {
    toolId: formId,
    version: 1,
    expectedRevision: 0,
    answers: {},
  });
  await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
  const page = { numItems: 20, cursor: null };
  expect(
    (
      await owner.auth.query(api.groupPolls.queries.getOwnHistory, {
        toolId: pollId,
        paginationOpts: page,
      })
    ).page
  ).toEqual([]);
  expect(
    (
      await owner.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId: formId,
        paginationOpts: page,
      })
    ).page
  ).toEqual([]);
  for (const table of [
    'groupTools',
    'groupPolls',
    'groupPollVotes',
    'groupPollRevisions',
    'groupForms',
    'groupFormResponses',
    'groupFormRevisions',
    'groupToolPolicies',
  ] as const)
    expect(await t.run(ctx => ctx.db.query(table).collect())).toEqual([]);
});

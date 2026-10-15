import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
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

describe('Persistent Group forms authenticated REST seam', () => {
  it('validates inputs, scopes, versions and private results through HTTP', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'rest-forms-owner', {
      groups: ['read', 'write'],
    });
    const member = await actor(t, 'rest-forms-member');
    const reader = await actor(t, 'rest-forms-reader', { groups: ['read'] });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'REST forms' }
    );
    await t.run(ctx =>
      ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      })
    );
    const path = `/groups/${groupId}/forms`;
    const input = {
      title: 'Book feedback',
      resultsVisibility: 'MANAGERS',
      questions: [
        { id: 'book', label: 'Book', type: 'SHORT_ANSWER', required: true },
      ],
    };
    await body(await reader.request(path, 'POST', input), 403);
    await body(await member.request(path, 'POST', input), 403);
    await body(
      await owner.request(path, 'POST', { ...input, title: ' ' }),
      400
    );
    const { toolId } = await body(
      await owner.request(path, 'POST', input),
      201
    );
    expect(await body(await member.request(`${path}/${toolId}`))).toMatchObject(
      { responseRevision: 0, version: 1, resultsVisibility: 'MANAGERS' }
    );
    await body(await member.request(`${path}/${toolId}/results`), 403);
    await body(
      await member.request(`${path}/${toolId}/response`, 'PUT', {
        version: 1,
        expectedRevision: 0,
        answers: {},
      }),
      400
    );
    expect(
      await body(
        await member.request(`${path}/${toolId}/response`, 'PUT', {
          version: 1,
          expectedRevision: 0,
          answers: { book: 'Dune' },
        })
      )
    ).toEqual({ revision: 1 });
    expect(
      await body(
        await member.request(`${path}/${toolId}/response`, 'PUT', {
          version: 1,
          expectedRevision: 0,
          answers: { book: 'Dune' },
        })
      )
    ).toEqual({ revision: 1 });
    await body(
      await member.request(`${path}/${toolId}/response`, 'PUT', {
        version: 1,
        expectedRevision: 0,
        answers: { book: 'Other' },
      }),
      409
    );
    expect(await t.run(ctx => ctx.db.query('notifications').collect())).toEqual(
      []
    );
    expect(
      await t.run(ctx => ctx.db.system.query('_scheduled_functions').collect())
    ).toEqual([]);
    expect(await t.run(ctx => ctx.db.query('events').collect())).toEqual([]);
    await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId,
      personId: member.personId,
    });
    await body(await member.request(`${path}/${toolId}`), 403);
    expect(
      (await body(await member.request(`${path}/${toolId}/history`))).page[0]
        .answers
    ).toEqual({ book: 'Dune' });
    await body(
      await member.request(`${path}/${toolId}/response`, 'DELETE'),
      204
    );
    expect(
      (await body(await member.request(`${path}/${toolId}/history`))).page
    ).toEqual([]);
    // Ban notification is an independent moderation operation, tested before the ban above.
  });
});

it.each(['self', 'admin-session', 'admin-rest'] as const)(
  'purges private records and anonymizes only latest shared contributions through %s',
  async mode => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, `forms-clean-owner-${mode}`);
    const author = await actor(t, `forms-clean-author-${mode}`);
    const admin = await actor(t, `forms-clean-admin-${mode}`);
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Cleanup forms' }
    );
    await t.run(ctx =>
      ctx.db.insert('groupMemberships', {
        groupId,
        personId: author.personId,
        role: 'MODERATOR',
        joinedAt: Date.now(),
      })
    );
    const toolIds = [];
    for (const resultsVisibility of ['MANAGERS', 'MEMBERS'] as const) {
      const toolId = await author.auth.mutation(
        api.groupForms.mutations.createForm,
        {
          groupId,
          title: resultsVisibility,
          resultsVisibility,
          questions: [
            {
              id: 'answer',
              label: 'Original question',
              type: 'SHORT_ANSWER',
              required: true,
            },
          ],
        }
      );
      toolIds.push(toolId);
      await author.auth.mutation(api.groupForms.mutations.submitResponse, {
        toolId,
        version: 1,
        expectedRevision: 0,
        answers: { answer: 'Saved' },
      });
      await author.auth.mutation(api.groupForms.mutations.submitResponse, {
        toolId,
        version: 1,
        expectedRevision: 1,
        answers: { answer: 'Edited' },
      });
    }
    if (mode === 'self')
      await author.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: `forms-clean-author-${mode}`,
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
    const personal = await owner.auth.query(
      api.groupForms.queries.listResults,
      { toolId: toolIds[0], paginationOpts: { numItems: 20, cursor: null } }
    );
    const shared = await owner.auth.query(api.groupForms.queries.listResults, {
      toolId: toolIds[1],
      paginationOpts: { numItems: 20, cursor: null },
    });
    expect(personal.page).toEqual([]);
    expect(shared.page).toHaveLength(1);
    expect(shared.page[0]).toMatchObject({
      answers: { answer: 'Edited' },
      revision: 2,
    });
    expect(shared.page[0].personId).toBeUndefined();
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupFormRevisions')
          .withIndex('by_personId', q => q.eq('personId', author.personId))
          .collect()
      )
    ).toEqual([]);
    for (const toolId of toolIds)
      expect(
        (await t.run(ctx => ctx.db.get(toolId)))?.creatorId
      ).toBeUndefined();
    expect(await t.run(ctx => ctx.db.query('notifications').collect())).toEqual(
      []
    );
  }
);

it('scopes disabled management reads/writes to current eligible managers without restoring interaction', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'rest-disabled-owner');
  const moderator = await actor(t, 'rest-disabled-mod');
  const member = await actor(t, 'rest-disabled-member');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Disabled REST settings',
  });
  await t.run(async ctx => {
    for (const [personId, role] of [
      [moderator.personId, 'MODERATOR'],
      [member.personId, 'MEMBER'],
    ] as const)
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId,
        role,
        joinedAt: Date.now(),
      });
  });
  const toolId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Preserved form',
      resultsVisibility: 'MANAGERS',
      questions: [],
    }
  );
  await owner.auth.mutation(api.groupTools.mutations.configureFormPolicy, {
    groupId,
    enabled: false,
    creation: 'MANAGERS',
  });
  const path = `/groups/${groupId}/forms/${toolId}`;
  const settings = await body(await moderator.request(`${path}/settings`));
  expect(settings).toMatchObject({
    title: 'Preserved form',
    version: 1,
    canManage: true,
  });
  expect(settings).not.toHaveProperty('answers');
  await body(await member.request(`${path}/settings`), 403);
  await body(await member.request(`/groups/${groupId}/forms`), 403);
  expect(
    (await body(await moderator.request(`/groups/${groupId}/forms`))).page.map(
      (row: { _id: string }) => row._id
    )
  ).toEqual([toolId]);
  await body(await moderator.request(path), 403);
  await body(await moderator.request(`${path}/results`), 403);
  await body(
    await moderator.request(`${path}/response`, 'PUT', {
      version: 1,
      expectedRevision: 0,
      answers: {},
    }),
    403
  );
  await body(
    await moderator.request(path, 'PATCH', {
      version: 1,
      title: 'Managed while disabled',
      questions: [],
    }),
    204
  );
  expect(
    (await body(await owner.request(`/groups/${groupId}/form-policy`))).enabled
  ).toBe(false);
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        {
          id: 'intro',
          label: 'Required',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    }
  );
  await body(await moderator.request(`${path}/settings`), 403);
  await body(
    await moderator.request(path, 'PATCH', {
      version: 2,
      title: 'Denied',
      questions: [],
    }),
    403
  );
  await body(await moderator.request(path, 'DELETE'), 403);
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, requiredCompletion: false, questions: [] }
  );
  await body(await moderator.request(path, 'DELETE'), 204);
});

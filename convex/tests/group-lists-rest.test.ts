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

describe('Persistent Group lists authenticated REST', () => {
  it('enforces scope, manager settings, private rows and optimistic removal over HTTP', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'list-http-owner');
    const member = await actor(t, 'list-http-member');
    const reader = await actor(t, 'list-http-reader', { groups: ['read'] });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'HTTP lists' }
    );
    await t.run(ctx =>
      ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      })
    );
    const path = `/groups/${groupId}/lists`;
    await body(
      await reader.request(path, 'POST', {
        title: 'Private',
        resultsVisibility: 'MANAGERS',
      }),
      403
    );
    const { toolId } = await body(
      await owner.request(path, 'POST', {
        title: 'Private',
        resultsVisibility: 'MANAGERS',
      }),
      201
    );
    const { entryId } = await body(
      await member.request(`${path}/${toolId}/entries`, 'POST', {
        version: 1,
        text: 'Saved',
      })
    );
    expect(
      (await body(await member.request(`${path}/${toolId}/entries`))).page
    ).toHaveLength(1);
    await body(await member.request(`${path}/${toolId}/settings`), 403);
    await body(
      await member.request(`${path}/${toolId}/entries/${entryId}`, 'PATCH', {
        version: 1,
        expectedRevision: 1,
        text: 'Changed',
        completed: true,
      })
    );
    await body(
      await member.request(`${path}/${toolId}/entries/${entryId}`, 'DELETE', {
        expectedRevision: 1,
      }),
      409
    );
    await owner.auth.mutation(api.groupTools.mutations.configureListPolicy, {
      groupId,
      enabled: false,
      creation: 'MANAGERS',
    });
    await body(await member.request(`${path}/${toolId}/entries`), 403);
    await body(await owner.request(`${path}/${toolId}/settings`));
    expect(
      (await body(await member.request(`${path}/${toolId}/own`))).page[0]
    ).toMatchObject({ listTitle: 'Private', text: 'Changed' });
    await body(
      await member.request(`${path}/${toolId}/entries/${entryId}`, 'DELETE', {
        expectedRevision: 2,
      }),
      204
    );
    await body(await owner.request(`${path}/${toolId}`, 'DELETE'), 204);
  });
});
it.each(['self', 'admin-session', 'admin-rest'] as const)(
  'cleans private and retry records, anonymizes shared latest via %s',
  async mode => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, `lists-clean-owner-${mode}`);
    const author = await actor(t, `lists-clean-author-${mode}`);
    const admin = await actor(t, `lists-clean-admin-${mode}`);
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Cleanup lists' }
    );
    await t.run(ctx =>
      ctx.db.insert('groupMemberships', {
        groupId,
        personId: author.personId,
        role: 'MODERATOR',
        joinedAt: Date.now(),
      })
    );
    const tools = [];
    for (const resultsVisibility of ['MANAGERS', 'MEMBERS'] as const) {
      const toolId = await author.auth.mutation(
        api.groupLists.mutations.createList,
        { groupId, title: resultsVisibility, resultsVisibility }
      );
      tools.push(toolId);
      await author.auth.mutation(api.groupLists.mutations.addEntry, {
        toolId,
        version: 1,
        text: 'Saved',
        requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      });
    }
    if (mode === 'self')
      await author.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: `lists-clean-author-${mode}`,
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
    const own = await owner.auth.query(api.groupLists.queries.listEntries, {
      toolId: tools[0],
      paginationOpts: { numItems: 20, cursor: null },
    });
    const shared = await owner.auth.query(api.groupLists.queries.listEntries, {
      toolId: tools[1],
      paginationOpts: { numItems: 20, cursor: null },
    });
    expect(own.page).toEqual([]);
    expect(shared.page).toHaveLength(1);
    expect(shared.page[0].personId).toBeUndefined();
    expect(shared.page[0].actorId).toBeUndefined();
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupListRequests')
          .withIndex('by_personId', q => q.eq('personId', author.personId))
          .collect()
      )
    ).toEqual([]);
    for (const toolId of tools)
      expect(
        (
          await owner.auth.query(api.groupLists.queries.getListForManagement, {
            toolId,
          })
        ).creatorId
      ).toBeUndefined();
  }
);

import { describe, expect, it } from 'vitest';
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

describe('Groups authenticated REST boundary', () => {
  it('supports paginated identity CRUD with duplicates, scoped reads, owner-only changes and stable links', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'rest-group-owner', {
      groups: ['read', 'write'],
    });
    const other = await actor(t, 'rest-group-other');
    const reader = await actor(t, 'rest-group-reader', { groups: ['read'] });
    const foreign = await actor(t, 'rest-group-foreign', {
      friends: ['read', 'write'],
    });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', {
        name: '  Readers  ',
        description: 'Books',
      }),
      201
    );
    await body(
      await owner.request('/groups', 'POST', { name: 'Readers' }),
      201
    );
    const first = await body(await owner.request('/groups?limit=1'));
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toEqual(expect.any(String));
    const second = await body(
      await owner.request(
        `/groups?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`
      )
    );
    expect(second.items).toHaveLength(1);
    expect(second.items[0]._id).not.toBe(first.items[0]._id);
    await body(
      await reader.request('/groups', 'POST', { name: 'Denied' }),
      403
    );
    await body(await foreign.request('/groups'), 403);
    await body(await owner.request('/groups/not-a-group'), 400);
    await body(await owner.request(`/groups/${owner.personId}`), 400);
    await body(await other.request(`/groups/${groupId}`), 404);
    await body(
      await other.request(`/groups/${groupId}`, 'PATCH', { name: 'Stolen' }),
      403
    );
    await body(await other.request(`/groups/${groupId}`, 'DELETE'), 403);
    await body(
      await owner.request(`/groups/${groupId}`, 'PATCH', {
        name: 'New readers',
        description: null,
      }),
      204
    );
    expect(await body(await owner.request(`/groups/${groupId}`))).toMatchObject(
      { _id: groupId, name: 'New readers', role: 'OWNER', memberCount: 1 }
    );
    expect(
      await t.query(api.groups.queries.getGroupLanding, { groupId })
    ).toEqual({ groupId, name: 'New readers', description: null, image: null });
    await body(
      await owner.request('/groups', 'POST', {
        name: '',
        ownerId: other.personId,
      }),
      400
    );
    await body(await owner.request('/groups?limit=101'), 400);
    await body(await owner.request(`/groups/${groupId}`, 'DELETE'), 204);
    await body(await owner.request(`/groups/${groupId}`), 404);
  });
  it('blocks administrative account deletion with a clear ownership conflict and preserves the Group', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'guard-owner');
    const admin = await actor(t, 'guard-admin');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Guarded' }),
      201
    );
    const conflict = await body(
      await admin.request(`/admin/users/${owner.user._id}`, 'DELETE'),
      409
    );
    expect(conflict.error).toMatchObject({ code: 'CONFLICT' });
    expect(await body(await owner.request(`/groups/${groupId}`))).toMatchObject(
      { name: 'Guarded', memberCount: 1 }
    );
  });
});

import { describe, expect, it } from 'vitest';
import { components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const actor = await createAuthAccount(t, 'platform-admin');
  const target = await createAuthAccount(t, 'target-user');
  const role = (value: 'user' | 'admin') =>
    t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: actor.user._id }],
        update: { role: value },
      },
    });
  await role('admin');
  const rawKey = 'grp_admin_transaction_test_key';
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: actor.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enabled: true,
      },
    },
  });
  const request = (
    version: 'v1' | 'v2',
    path: string,
    method: string,
    body?: unknown
  ) =>
    t.fetch(`/api/${version}${path}`, {
      method,
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { t, actor, target, role, request };
}

describe('Administrative writes recheck actor authority', () => {
  it.each(['delete', 'role'] as const)(
    'rejects %s after the actor loses administrator role',
    async operation => {
      const { t, actor, target, role } = await setup();
      expect(
        await t.query(internal.admin.rest.isAdmin, { userId: actor.user._id })
      ).toBe(true);
      await role('user');
      const write =
        operation === 'delete'
          ? t.mutation(internal.admin.rest.deleteUser, {
              actorUserId: actor.user._id,
              userId: target.user._id,
            })
          : t.mutation(internal.admin.rest.setUserRole, {
              actorUserId: actor.user._id,
              userId: target.user._id,
              role: 'admin',
            });
      await expect(write).rejects.toThrow('Admin privileges required');
      expect(await t.run(ctx => ctx.db.get(target.personId))).not.toBeNull();
      expect(
        await t.query(internal.admin.rest.isAdmin, { userId: target.user._id })
      ).toBe(false);
    }
  );
  it.each(['v1', 'v2'] as const)(
    'preserves %s administrator write responses and rejects demoted actors',
    async version => {
      const { t, actor, target, role, request } = await setup();
      const changed = await request(
        version,
        `/admin/users/${target.user._id}/role`,
        'PUT',
        { role: 'admin' }
      );
      expect(changed.status).toBe(200);
      expect(await changed.json()).toEqual(
        version === 'v1'
          ? { success: true, data: { message: 'User role updated to admin' } }
          : { message: 'User role updated to admin' }
      );
      expect(
        await t.query(internal.admin.rest.isAdmin, { userId: target.user._id })
      ).toBe(true);
      await role('user');
      expect(
        (await request(version, `/admin/users/${target.user._id}`, 'DELETE'))
          .status
      ).toBe(403);
      await role('admin');
      const removed = await request(
        version,
        `/admin/users/${target.user._id}`,
        'DELETE'
      );
      expect(removed.status).toBe(version === 'v1' ? 200 : 204);
      if (version === 'v1')
        expect(await removed.json()).toEqual({
          success: true,
          data: { message: 'User deleted successfully' },
        });
      else expect(await removed.text()).toBe('');
      expect(await t.run(ctx => ctx.db.get(target.personId))).toBeNull();
      // Existing policy permits self-demotion; only subsequent writes are forbidden.
      await expect(
        t.mutation(internal.admin.rest.setUserRole, {
          actorUserId: actor.user._id,
          userId: actor.user._id,
          role: 'user',
        })
      ).resolves.toEqual({ success: true });
    }
  );
});

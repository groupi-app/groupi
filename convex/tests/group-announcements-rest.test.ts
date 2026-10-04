import { describe, expect, it, vi } from 'vitest';
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

describe('Explicit announcements REST boundary', () => {
  it('requires Group write scope/current manager role and returns private aggregate recovery status', async () => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'rest-ann-owner', {
      groups: ['read', 'write'],
    });
    const member = await actor(t, 'rest-ann-member');
    const readOnly = await actor(t, 'rest-ann-reader', { groups: ['read'] });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'REST announcements' }
    );
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
    });
    const endpoint = `/groups/${groupId}/announcements`;
    await body(
      await member.request(endpoint, 'POST', {
        title: 'Denied',
        message: 'No',
      }),
      403
    );
    await body(
      await readOnly.request(endpoint, 'POST', {
        title: 'Denied',
        message: 'No',
      }),
      403
    );
    await body(
      await owner.request(endpoint, 'POST', { title: '', message: 'No' }),
      400
    );
    const first = await body(
      await owner.request(endpoint, 'POST', {
        title: 'Reading',
        message: 'Bring a book',
      }),
      202
    );
    expect(first).toMatchObject({
      state: 'PROCESSING',
      notified: 0,
      skipped: 0,
    });
    expect(Object.keys(first).sort()).toEqual([
      'announcementId',
      'notified',
      'skipped',
      'state',
    ]);
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    const recovered = await body(
      await owner.request(endpoint, 'POST', {
        title: 'Reading',
        message: 'Bring a book',
      }),
      202
    );
    expect(recovered).toMatchObject({
      announcementId: first.announcementId,
      state: 'COMPLETED',
      notified: 1,
    });
    await body(
      await owner.request(endpoint, 'POST', {
        title: 'Reading',
        message: 'Changed',
      }),
      409
    );
    vi.useRealTimers();
  });
});

it.each(['self', 'admin-session', 'admin-rest'] as const)(
  'purges sender announcement data immediately through %s account deletion',
  async mode => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, `cleanup-owner-${mode}`);
    const sender = await actor(t, `cleanup-sender-${mode}`);
    const admin = await actor(t, `cleanup-admin-${mode}`);
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Cleanup' }
    );
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: sender.personId,
        role: 'MODERATOR',
        joinedAt: Date.now(),
      });
    });
    const sent = await body(
      await sender.request(`/groups/${groupId}/announcements`, 'POST', {
        title: 'Hello',
        message: 'Remove on deletion',
      }),
      202
    );
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toHaveLength(1);
    if (mode === 'self')
      await sender.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: `cleanup-sender-${mode}`,
      });
    else if (mode === 'admin-session')
      await admin.auth.mutation(api.admin.mutations.deletePerson, {
        personId: sender.personId,
      });
    else
      await body(
        await admin.request(`/admin/users/${sender.user._id}`, 'DELETE'),
        204
      );
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toEqual([]);
    // Required cleanup seam verifies no private manager message/request record survives.
    expect(await t.run(ctx => ctx.db.get(sent.announcementId))).toBeNull();
    vi.useRealTimers();
  }
);

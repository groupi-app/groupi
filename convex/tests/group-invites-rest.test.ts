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

describe('Group invitation authenticated REST authority', () => {
  it('enforces collection scopes, privacy, private roster and one-time admission over HTTP', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'http-invite-owner', {
      groups: ['read', 'write'],
    });
    const recipient = await actor(t, 'http-invite-recipient', {
      'group-invites': ['read', 'write'],
      groups: ['read'],
      settings: ['read', 'write'],
      notifications: ['read'],
    });
    const stranger = await actor(t, 'http-invite-stranger');
    const wrongScope = await actor(t, 'http-invite-wrong-scope', {
      friends: ['read', 'write'],
    });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'HTTP community' }),
      201
    );
    expect(
      await body(await recipient.request('/settings/privacy'))
    ).toMatchObject({ allowGroupInvitesFrom: 'EVERYONE' });
    await body(
      await recipient.request('/settings/privacy', 'PUT', {
        allowGroupInvitesFrom: 'NO_ONE',
      })
    );
    const unavailable = await body(
      await owner.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: recipient.personId,
      }),
      409
    );
    expect(unavailable.error).toEqual({
      code: 'RECIPIENT_UNAVAILABLE',
      message: 'This recipient or invitation is unavailable.',
    });
    expect(
      await body(
        await owner.request(`/groups/${groupId}/invitations`, 'POST', {
          inviteePersonId: 'not-a-user',
        }),
        409
      )
    ).toEqual(unavailable);
    await body(
      await recipient.request('/settings/privacy', 'PUT', {
        allowGroupInvitesFrom: 'EVERYONE',
      })
    );
    await body(await wrongScope.request('/group-invites'), 403);
    await body(
      await wrongScope.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: recipient.personId,
      }),
      403
    );
    await body(
      await recipient.request(`/groups/${groupId}/invitation-policy`, 'PATCH', {
        invitationsEnabled: false,
      }),
      403
    );
    const sent = await body(
      await owner.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: recipient.personId,
      })
    );
    expect(
      await body(
        await owner.request(`/groups/${groupId}/invitations`, 'POST', {
          inviteePersonId: recipient.personId,
        })
      )
    ).toEqual(sent);
    await body(
      await stranger.request(`/group-invites/${sent.inviteId}/accept`, 'POST'),
      403
    );
    await body(await recipient.request(`/groups/${groupId}/members`), 403);
    await body(await recipient.request(`/groups/${groupId}/invitations`), 403);
    const inbox = await body(
      await recipient.request('/group-invites?limit=1&status=PENDING')
    );
    expect(inbox.items).toMatchObject([
      { inviteId: sent.inviteId, status: 'PENDING', available: true },
    ]);
    expect(JSON.stringify(inbox)).not.toContain('@example.com');
    const accepted = await body(
      await recipient.request(`/group-invites/${sent.inviteId}/accept`, 'POST')
    );
    expect(
      await body(
        await recipient.request(
          `/group-invites/${sent.inviteId}/accept`,
          'POST'
        )
      )
    ).toEqual(accepted);
    const first = await body(
      await recipient.request(`/groups/${groupId}/members?limit=1`)
    );
    expect(first.items).toMatchObject([
      { personId: owner.personId, role: 'OWNER' },
    ]);
    expect(first.nextCursor).toEqual(expect.any(String));
    const second = await body(
      await recipient.request(
        `/groups/${groupId}/members?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`
      )
    );
    expect(second.items).toMatchObject([
      { personId: recipient.personId, role: 'MEMBER' },
    ]);
    const tail = await body(
      await recipient.request(
        `/groups/${groupId}/members?limit=1&cursor=${encodeURIComponent(second.nextCursor)}`
      )
    );
    expect(tail.items).toEqual([]);
    expect(tail.nextCursor).toBeNull();
    expect(JSON.stringify([...first.items, ...second.items])).not.toContain(
      '@example.com'
    );
    expect(first.items[0]).not.toHaveProperty('userId');
    expect(first.items[0]).not.toHaveProperty('answers');
    const notifications = await body(
      await recipient.request('/notifications?pagination=cursor&limit=20')
    );
    expect(
      notifications.items.find(
        (n: { type: string }) => n.type === 'GROUP_INVITE_RECEIVED'
      )
    ).toMatchObject({
      group: { id: groupId, title: 'HTTP community' },
      groupInvite: { id: sent.inviteId, status: 'ACCEPTED' },
      author: { user: { email: null } },
    });
    expect(
      (await body(await owner.request(`/groups/${groupId}`))).memberCount
    ).toBe(2);
    await body(
      await owner.request(`/groups/${groupId}/members?limit=101`),
      400
    );
    await body(
      await owner.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: stranger.personId,
        inviterId: stranger.personId,
      }),
      400
    );
    await body(await owner.request(`/groups/${groupId}`, 'DELETE'), 204);
    expect(
      (await body(await recipient.request('/group-invites'))).items
    ).toEqual([]);
  });
  it('administrative account deletions remove private invites and admitted membership without retiring the Group', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'admin-cleanup-owner');
    const admin = await actor(t, 'admin-cleanup-admin');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Preserved' }),
      201
    );
    for (const path of ['rest', 'app'] as const) {
      const recipient = await actor(t, `admin-cleanup-${path}`);
      const sent = await body(
        await owner.request(`/groups/${groupId}/invitations`, 'POST', {
          inviteePersonId: recipient.personId,
        })
      );
      await body(
        await recipient.request(
          `/group-invites/${sent.inviteId}/accept`,
          'POST'
        )
      );
      if (path === 'rest')
        await body(
          await admin.request(`/admin/users/${recipient.user._id}`, 'DELETE'),
          204
        );
      else
        await admin.auth.mutation(api.admin.mutations.deletePerson, {
          personId: recipient.personId,
        });
      expect(
        (await body(await owner.request(`/groups/${groupId}`))).memberCount
      ).toBe(1);
      expect(
        (await body(await owner.request(`/groups/${groupId}/invitations`)))
          .items
      ).toEqual([]);
      const privateRows = await t.run(async ctx => ({
        invites: await ctx.db.query('groupInvites').collect(),
        notifications: await ctx.db
          .query('notifications')
          .withIndex('by_groupId', q => q.eq('groupId', groupId))
          .collect(),
      }));
      expect(privateRows).toEqual({ invites: [], notifications: [] });
    }
  });
});

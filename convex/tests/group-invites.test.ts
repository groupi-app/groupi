import { describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
const paginationOpts = { numItems: 20, cursor: null };
describe('Group invitations through real authenticated sessions', () => {
  it('admits an invited recipient once without creating Event membership or friendship', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'invite-owner');
    const recipient = await createAuthAccount(t, 'invite-recipient');
    const outsider = await createAuthAccount(t, 'invite-outsider');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Readers' }
    );
    const sent = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: recipient.personId }
    );
    expect(
      (
        await recipient.auth.query(
          api.groupInvites.queries.listMyGroupInvites,
          { paginationOpts }
        )
      ).page
    ).toMatchObject([
      {
        inviteId: sent.inviteId,
        status: 'PENDING',
        group: { groupId, name: 'Readers' },
      },
    ]);
    await expect(
      outsider.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: sent.inviteId,
      })
    ).rejects.toThrow('recipient');
    const [accepted, concurrent] = await Promise.all([
      recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: sent.inviteId,
      }),
      recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: sent.inviteId,
      }),
    ]);
    expect(concurrent).toEqual(accepted);
    expect(
      await recipient.auth.mutation(
        api.groupInvites.mutations.acceptGroupInvite,
        { inviteId: sent.inviteId }
      )
    ).toEqual(accepted);
    expect(
      await recipient.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({
      viewerRole: 'MEMBER',
      memberCount: 2,
      canManageIdentity: false,
    });
    expect(
      (
        await recipient.auth.query(api.groups.queries.listGroupMembers, {
          groupId,
          paginationOpts,
        })
      ).page
    ).toMatchObject([
      { personId: owner.personId, role: 'OWNER' },
      { personId: recipient.personId, role: 'MEMBER' },
    ]);
    await expect(
      outsider.auth.query(api.groups.queries.listGroupMembers, {
        groupId,
        paginationOpts,
      })
    ).rejects.toThrow();
    const independent = await t.run(async ctx => ({
      events: await ctx.db.query('memberships').collect(),
      friends: await ctx.db.query('friendships').collect(),
      notifications: await ctx.db.query('notifications').collect(),
    }));
    expect(independent.events).toEqual([]);
    expect(independent.friends).toEqual([]);
    expect(
      independent.notifications.filter(n => n.type === 'GROUP_INVITE_RECEIVED')
    ).toHaveLength(1);
    expect(
      independent.notifications.filter(n => n.type === 'GROUP_INVITE_ACCEPTED')
    ).toHaveLength(1);
  });
  it('keeps Group invitation privacy separate and uses generic unavailability for confidential conditions', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'privacy-owner');
    const recipient = await createAuthAccount(t, 'privacy-recipient');
    const missing = await createAuthAccount(t, 'privacy-deleted');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Private' }
    );
    expect(
      await recipient.auth.query(api.settings.queries.getPrivacySettings, {})
    ).toMatchObject({ allowGroupInvitesFrom: 'EVERYONE' });
    await recipient.auth.mutation(api.settings.mutations.savePrivacySettings, {
      allowFriendRequestsFrom: 'EVERYONE',
      allowEventInvitesFrom: 'NO_ONE',
      allowGroupInvitesFrom: 'NO_ONE',
    });
    const input = { groupId, inviteePersonId: recipient.personId };
    let privacyError = '';
    try {
      await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        input
      );
    } catch (error) {
      privacyError = error instanceof Error ? error.message : String(error);
    }
    expect(privacyError).toContain('RECIPIENT_UNAVAILABLE');
    await recipient.auth.mutation(api.settings.mutations.savePrivacySettings, {
      allowFriendRequestsFrom: 'EVERYONE',
      allowEventInvitesFrom: 'NO_ONE',
    });
    expect(
      await recipient.auth.query(api.settings.queries.getPrivacySettings, {})
    ).toMatchObject({ allowGroupInvitesFrom: 'NO_ONE' });
    await recipient.auth.mutation(api.settings.mutations.savePrivacySettings, {
      allowFriendRequestsFrom: 'EVERYONE',
      allowEventInvitesFrom: 'NO_ONE',
      allowGroupInvitesFrom: 'FRIENDS',
    });
    await expect(
      owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, input)
    ).rejects.toThrow('unavailable');
    const friend = await owner.auth.mutation(
      api.friends.mutations.sendFriendRequest,
      { addresseePersonId: recipient.personId }
    );
    await recipient.auth.mutation(api.friends.mutations.acceptFriendRequest, {
      friendshipId: friend.friendshipId,
    });
    const sent = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      input
    );
    expect(
      await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        input
      )
    ).toEqual(sent);
    await recipient.auth.mutation(api.friends.mutations.blockUser, {
      personId: owner.personId,
    });
    await expect(
      owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, input)
    ).rejects.toThrow(privacyError);
    await expect(
      recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: sent.inviteId,
      })
    ).rejects.toThrow('unavailable');
    await missing.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'privacy-deleted',
    });
    await expect(
      owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
        groupId,
        inviteePersonId: missing.personId,
      })
    ).rejects.toThrow(privacyError);
  });
  it('enforces owner entry policy on pending acceptance and permits explicit decline/cancel without admission', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'policy-owner');
    const recipient = await createAuthAccount(t, 'policy-recipient');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Policy' }
    );
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: recipient.personId }
    );
    await expect(
      recipient.auth.mutation(
        api.groups.mutations.updateGroupInvitationPolicy,
        { groupId, invitationsEnabled: false }
      )
    ).rejects.toThrow('owner');
    await owner.auth.mutation(
      api.groups.mutations.updateGroupInvitationPolicy,
      { groupId, invitationsEnabled: false }
    );
    await expect(
      recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: offer.inviteId,
      })
    ).rejects.toThrow('unavailable');
    expect(
      await recipient.auth.query(
        api.groupInvites.queries.getMyGroupInviteForGroup,
        { groupId }
      )
    ).toMatchObject({ status: 'PENDING', available: false });
    await recipient.auth.mutation(
      api.groupInvites.mutations.declineGroupInvite,
      { inviteId: offer.inviteId }
    );
    expect(
      await recipient.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    await expect(
      owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
        groupId,
        inviteePersonId: recipient.personId,
      })
    ).rejects.toThrow('disabled');
    await owner.auth.mutation(
      api.groups.mutations.updateGroupInvitationPolicy,
      { groupId, invitationsEnabled: true }
    );
    const next = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: recipient.personId }
    );
    expect(next.inviteId).not.toBe(offer.inviteId);
    await owner.auth.mutation(api.groupInvites.mutations.cancelGroupInvite, {
      inviteId: next.inviteId,
    });
    await expect(
      recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: next.inviteId,
      })
    ).rejects.toThrow('resolved');
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 1 });
  });
  it('rechecks current Auth accounts and cleans private invitation data on account and Group deletion', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'cleanup-owner');
    const recipient = await createAuthAccount(t, 'cleanup-recipient');
    const missingAuth = await createAuthAccount(t, 'cleanup-missing-auth');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Cleanup' }
    );
    await t.mutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: missingAuth.user._id }],
      },
    });
    await expect(
      owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
        groupId,
        inviteePersonId: missingAuth.personId,
      })
    ).rejects.toThrow('unavailable');
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: recipient.personId }
    );
    await recipient.auth.mutation(
      api.groupInvites.mutations.acceptGroupInvite,
      { inviteId: offer.inviteId }
    );
    const ownNotifications = await recipient.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(ownNotifications.notifications[0]).toMatchObject({
      group: { id: groupId, title: 'Cleanup' },
      groupInvite: { id: offer.inviteId, status: 'ACCEPTED' },
      author: { user: { email: null } },
    });
    await recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'cleanup-recipient',
    });
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 1 });
    expect(
      (
        await owner.auth.query(api.groupInvites.queries.listGroupInvites, {
          groupId,
          paginationOpts,
        })
      ).page
    ).toEqual([]);
    const remaining = await t.run(async ctx => ({
      invites: await ctx.db.query('groupInvites').collect(),
      notifications: await ctx.db
        .query('notifications')
        .withIndex('by_groupId', q => q.eq('groupId', groupId))
        .collect(),
    }));
    expect(remaining).toEqual({ invites: [], notifications: [] });
    const other = await createAuthAccount(t, 'cleanup-other');
    await owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
      groupId,
      inviteePersonId: other.personId,
    });
    await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
    expect(
      (
        await other.auth.query(api.groupInvites.queries.listMyGroupInvites, {
          paginationOpts,
        })
      ).page
    ).toEqual([]);
    const final = await t.run(async ctx => ({
      invites: await ctx.db.query('groupInvites').collect(),
      members: await ctx.db.query('groupMemberships').collect(),
      notifications: await ctx.db
        .query('notifications')
        .withIndex('by_groupId', q => q.eq('groupId', groupId))
        .collect(),
    }));
    expect(final).toEqual({ invites: [], members: [], notifications: [] });
  });

  it('uses existing push preference controls and removes pending Group delivery metadata on deletion', async () => {
    vi.useFakeTimers();
    try {
      const t = createTestInstance();
      registerBetterAuth(t);
      const owner = await createAuthAccount(t, 'delivery-owner');
      const recipient = await createAuthAccount(t, 'delivery-recipient');
      await recipient.auth.mutation(
        api.pushNotifications.mutations.registerDevice,
        {
          token: 'ExpoPushToken[group-fixture-device]',
          deviceId: 'group-fixture-device',
          platform: 'ios',
          projectId: 'project-a',
          appId: 'gg.groupi.mobile',
        }
      );
      await recipient.auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        {
          notificationMethods: [
            {
              type: 'PUSH',
              enabled: true,
              value: 'Native device',
              notifications: [
                { notificationType: 'GROUP_INVITE_RECEIVED', enabled: false },
              ],
            },
          ],
        }
      );
      const disabled = await owner.auth.mutation(
        api.groups.mutations.createGroup,
        { name: 'Muted delivery' }
      );
      await owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
        groupId: disabled,
        inviteePersonId: recipient.personId,
      });
      expect(
        await t.run(ctx => ctx.db.query('pushDeliveries').collect())
      ).toEqual([]);
      expect(
        (
          await recipient.auth.query(
            api.notifications.queries.fetchNotificationsForPerson,
            {}
          )
        ).notifications
      ).toHaveLength(1);
      await recipient.auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        {
          notificationMethods: [
            {
              type: 'PUSH',
              enabled: true,
              value: 'Native device',
              notifications: [
                { notificationType: 'GROUP_INVITE_RECEIVED', enabled: true },
              ],
            },
          ],
        }
      );
      const enabled = await owner.auth.mutation(
        api.groups.mutations.createGroup,
        { name: 'Enabled delivery' }
      );
      const invite = await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId: enabled, inviteePersonId: recipient.personId }
      );
      const deliveries = await t.run(ctx =>
        ctx.db.query('pushDeliveries').collect()
      );
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]).toMatchObject({
        destination: 'group',
        groupId: enabled,
        status: 'PENDING',
      });
      expect(deliveries[0].title).toContain('Enabled delivery');
      await owner.auth.mutation(api.groups.mutations.deleteGroup, {
        groupId: enabled,
      });
      expect(
        await t.run(ctx => ctx.db.query('pushDeliveries').collect())
      ).toEqual([]);
      expect(
        await recipient.auth.query(
          api.groupInvites.queries.getMyGroupInviteForGroup,
          { groupId: enabled }
        )
      ).toBeNull();
      expect(await t.run(ctx => ctx.db.get(invite.inviteId))).toBeNull();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('exposes new Group notification defaults for existing methods and preserves explicit choices', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const account = await createAuthAccount(t, 'legacy-notification-settings');
    await account.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'existing@example.com',
            notifications: [
              { notificationType: 'EVENT_EDITED', enabled: false },
            ],
          },
        ],
      }
    );
    const legacy = await account.auth.query(
      api.settings.queries.getNotificationSettings,
      {}
    );
    expect(legacy.notificationMethods[0].notifications).toEqual(
      expect.arrayContaining([
        { notificationType: 'GROUP_INVITE_RECEIVED', enabled: true },
        { notificationType: 'GROUP_INVITE_ACCEPTED', enabled: true },
        { notificationType: 'EVENT_EDITED', enabled: false },
      ])
    );
    await account.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'existing@example.com',
            notifications: [
              { notificationType: 'GROUP_INVITE_RECEIVED', enabled: false },
            ],
          },
        ],
      }
    );
    const saved = await account.auth.query(
      api.settings.queries.getNotificationSettings,
      {}
    );
    expect(saved.notificationMethods[0].notifications).toContainEqual({
      notificationType: 'GROUP_INVITE_RECEIVED',
      enabled: false,
    });
    expect(
      saved.notificationMethods[0].notifications.filter(
        n => n.notificationType === 'GROUP_INVITE_RECEIVED'
      )
    ).toHaveLength(1);
  });
});

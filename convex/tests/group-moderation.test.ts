import { describe, it, expect } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
const paginationOpts = { numItems: 20, cursor: null };
describe('authenticated Group moderation', () => {
  it('keeps owner-only appointments separate from ordinary member management and Events', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'mod-owner');
    const mod = await createAuthAccount(t, 'mod-moderator');
    const member = await createAuthAccount(t, 'mod-member');
    const independentEvent = await member.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Independent Event', chosenDateTime: '2027-01-01T12:00:00Z' }
    );
    const independentBefore = await t.run(ctx =>
      ctx.db.get(independentEvent.membershipId)
    );
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Moderation' }
    );
    for (const person of [mod, member]) {
      const offer = await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId, inviteePersonId: person.personId }
      );
      await person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: offer.inviteId,
      });
    }
    await owner.auth.mutation(
      api.groupModeration.mutations.setGroupMemberRole,
      { groupId, personId: mod.personId, role: 'MODERATOR' }
    );
    expect(
      await mod.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({
      viewerRole: 'MODERATOR',
      canManageInvitations: true,
      canManageIdentity: false,
      canManageRoles: false,
      canLeave: true,
    });
    await expect(
      mod.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
        groupId,
        personId: member.personId,
        role: 'MODERATOR',
      })
    ).rejects.toThrow('owner');
    await expect(
      mod.auth.mutation(api.groupModeration.mutations.removeGroupMember, {
        groupId,
        personId: owner.personId,
      })
    ).rejects.toThrow();
    await expect(
      owner.auth.mutation(api.groupModeration.mutations.leaveGroup, { groupId })
    ).rejects.toThrow('owner');
    const removed = await mod.auth.mutation(
      api.groupModeration.mutations.removeGroupMember,
      { groupId, personId: member.personId }
    );
    expect(removed).toEqual({ removed: true });
    expect(
      await mod.auth.mutation(api.groupModeration.mutations.removeGroupMember, {
        groupId,
        personId: member.personId,
      })
    ).toEqual({ removed: false });
    expect(
      await member.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 2 });
    expect(
      (
        await member.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_MEMBER_REMOVED')
    ).toHaveLength(1);
    const offer = await mod.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: member.personId }
    );
    await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: offer.inviteId,
    });
    const left = await mod.auth.mutation(
      api.groupModeration.mutations.leaveGroup,
      { groupId }
    );
    expect(left).toEqual({ left: true });
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 2 });
    expect(
      (
        await owner.auth.query(api.groups.queries.listGroupMembers, {
          groupId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(2);
    expect(
      await t.run(async ctx => ({
        events: await ctx.db.query('memberships').collect(),
        friends: await ctx.db.query('friendships').collect(),
      }))
    ).toEqual({ events: [independentBefore], friends: [] });
  });
  it('ban excludes pending invitations and reentry until a manager lifts it, while accepted replay never readmits', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'ban-owner');
    const person = await createAuthAccount(t, 'ban-target');
    const stranger = await createAuthAccount(t, 'ban-stranger');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Bans' }
    );
    const pending = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: person.personId }
    );
    expect(
      await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
        groupId,
        personId: person.personId,
      })
    ).toEqual({ banned: true });
    await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId,
      personId: person.personId,
    });
    expect(
      (
        await person.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_MEMBER_BANNED')
    ).toHaveLength(1);
    await expect(
      person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: pending.inviteId,
      })
    ).rejects.toThrow('unavailable');
    await expect(
      owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
        groupId,
        inviteePersonId: person.personId,
      })
    ).rejects.toThrow('unavailable');
    await expect(
      stranger.auth.query(api.groupModeration.queries.listGroupBans, {
        groupId,
        paginationOpts,
      })
    ).rejects.toThrow();
    expect(
      (
        await owner.auth.query(api.groupModeration.queries.listGroupBans, {
          groupId,
          paginationOpts,
        })
      ).page
    ).toMatchObject([{ personId: person.personId, username: 'ban-target' }]);
    await owner.auth.mutation(api.groupModeration.mutations.liftGroupBan, {
      groupId,
      personId: person.personId,
    });
    const accepted = await person.auth.mutation(
      api.groupInvites.mutations.acceptGroupInvite,
      { inviteId: pending.inviteId }
    );
    await person.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId,
    });
    await expect(
      person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: pending.inviteId,
      })
    ).rejects.toThrow('resolved');
    const next = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: person.personId }
    );
    expect(next.inviteId).not.toEqual(pending.inviteId);
    await person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: next.inviteId,
    });
    expect(accepted.status).toBe('ACCEPTED');
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 2 });
  });
  it('rechecks deleted Auth actors and targets and preserves ownership before any cleanup writes', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'stale-mod-owner');
    const target = await createAuthAccount(t, 'stale-mod-target');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Current identities' }
    );
    await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId,
      personId: target.personId,
    });
    await expect(
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'stale-mod-owner',
      })
    ).rejects.toThrow('owned Groups');
    expect(
      (
        await owner.auth.query(api.groupModeration.queries.listGroupBans, {
          groupId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(1);
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: owner.user._id }],
        update: { banned: true, banExpires: Date.now() + 100000 },
      },
    });
    await expect(
      owner.auth.mutation(api.groupModeration.mutations.liftGroupBan, {
        groupId,
        personId: target.personId,
      })
    ).rejects.toThrow('unavailable');
    expect(
      (await t.run(ctx => ctx.db.query('groupBans').collect()))[0]
    ).toMatchObject({ active: true });
  });

  it('concurrent ban and acceptance preserve exclusion, one count and one affected-person notice', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'race-ban-owner');
    const person = await createAuthAccount(t, 'race-ban-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Admission race' }
    );
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: person.personId }
    );
    await Promise.allSettled([
      owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
        groupId,
        personId: person.personId,
      }),
      person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: offer.inviteId,
      }),
    ]);
    await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId,
      personId: person.personId,
    });
    await expect(
      person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: offer.inviteId,
      })
    ).rejects.toThrow();
    expect(
      await person.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 1 });
    const notices = (
      await person.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications.filter(n => n.type === 'GROUP_MEMBER_BANNED');
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({
      group: { id: groupId, title: 'Admission race' },
      author: { user: { email: null } },
    });
    await person.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'PUSH',
            enabled: true,
            value: 'Native device',
            notifications: [
              { notificationType: 'GROUP_MEMBER_BANNED', enabled: false },
              { notificationType: 'GROUP_MEMBER_REMOVED', enabled: false },
            ],
          },
        ],
      }
    );
    const settings = await person.auth.query(
      api.settings.queries.getNotificationSettings,
      {}
    );
    expect(settings.notificationMethods[0].notifications).toEqual(
      expect.arrayContaining([
        { notificationType: 'GROUP_MEMBER_BANNED', enabled: false },
        { notificationType: 'GROUP_MEMBER_REMOVED', enabled: false },
      ])
    );
  });
});

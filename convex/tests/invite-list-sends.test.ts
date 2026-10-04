import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, TestScenarios } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const event = await TestScenarios.singleEvent(t);
  const owner = await createAuthAccount(t, 'list-inviter', event.personId);
  const recipient = await createAuthAccount(t, 'list-invitee');
  return {
    t,
    owner,
    recipient,
    eventId: event.eventId,
    ownerMembershipId: event.membershipId,
  };
}
function requestId() {
  return `${Date.now()}.${crypto.randomUUID()}`;
}

describe('Reviewed Invite list recipients', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('enforces session authentication, event authority, creator expansion and organizer-only Moderator before sends', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const attendee = await createAuthAccount(t, 'attendee-inviter');
    const moderator = await createAuthAccount(t, 'moderator-inviter');
    await t.run(async ctx => {
      for (const [account, role] of [
        [attendee, 'ATTENDEE'],
        [moderator, 'MODERATOR'],
      ] as const)
        await ctx.db.insert('memberships', {
          personId: account.personId,
          eventId,
          role,
          rsvpStatus: 'YES',
        });
    });
    const args = {
      eventId,
      personIds: [recipient.personId],
      requestId: requestId(),
    };
    await expect(
      t.mutation(api.inviteLists.mutations.sendInviteListRecipients, args)
    ).rejects.toThrow('Authentication required');
    await expect(
      t.query(api.inviteLists.queries.reviewInviteListRecipients, {
        eventId,
        personIds: args.personIds,
      })
    ).rejects.toThrow('Authentication required');
    await expect(
      recipient.auth.query(api.inviteLists.queries.reviewInviteListRecipients, {
        eventId,
        personIds: args.personIds,
      })
    ).rejects.toThrow('Event membership required');
    await expect(
      attendee.auth.mutation(
        api.inviteLists.mutations.sendInviteListRecipients,
        args
      )
    ).rejects.toThrow('Permission denied');
    await owner.auth.mutation(api.events.mutations.updateEventPermissions, {
      eventId,
      inviteMembers: 'EVERYONE',
    });
    for (const actor of [attendee, moderator])
      await expect(
        actor.auth.mutation(
          api.inviteLists.mutations.sendInviteListRecipients,
          { ...args, role: 'MODERATOR' }
        )
      ).rejects.toThrow('Only organizers');
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Only mine', personIds: [recipient.personId] }
    );
    await expect(
      attendee.auth.mutation(api.inviteLists.mutations.inviteListToEvent, {
        inviteListId: list.inviteListId,
        eventId,
      })
    ).rejects.toThrow('Invite list not found');
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(0);
    const sent = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      { ...args, role: 'MODERATOR' }
    );
    expect(sent.sentCount).toBe(1);
    expect(
      (
        await recipient.auth.query(
          api.eventInvites.queries.getPendingEventInvites,
          {}
        )
      )[0].role
    ).toBe('MODERATOR');
  });
  it('checks current event permission before protected replay', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const otherOrganizer = await createAuthAccount(t, 'other-organizer');
    await t.run(ctx =>
      ctx.db.insert('memberships', {
        personId: otherOrganizer.personId,
        eventId,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      })
    );
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Protected', personIds: [recipient.personId] }
    );
    const args = {
      eventId,
      inviteListId: list.inviteListId,
      requestId: requestId(),
    };
    expect(
      (
        await owner.auth.mutation(
          api.inviteLists.mutations.inviteListToEvent,
          args
        )
      ).sentCount
    ).toBe(1);
    await owner.auth.mutation(api.events.mutations.updateEventPermissions, {
      eventId,
      inviteMembers: 'ORGANIZER',
    });
    const offer = await owner.auth.mutation(
      api.eventTransfers.mutations.offer,
      {
        eventId,
        recipientId: otherOrganizer.personId,
      }
    );
    await otherOrganizer.auth.mutation(api.eventTransfers.mutations.accept, {
      eventId,
      transferId: offer!.transferId!,
    });
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.inviteListToEvent, args)
    ).rejects.toThrow('Permission denied');
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
  });
  it('prevents concurrent distinct requests from creating duplicate pending invitations or notifications', async () => {
    const { owner, recipient, eventId } = await setup();
    const results = await Promise.all(
      [requestId(), requestId()].map(id =>
        owner.auth.mutation(
          api.inviteLists.mutations.sendInviteListRecipients,
          { eventId, personIds: [recipient.personId], requestId: id }
        )
      )
    );
    expect(results.map(result => result.sentCount).sort()).toEqual([0, 1]);
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toHaveLength(1);
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
  });
  it('reports mixed eligibility truthfully while masking bans, blocks, preferences and missing accounts', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const member = await createAuthAccount(t, 'existing-member');
    const pending = await createAuthAccount(t, 'pending-invite');
    const banned = await createAuthAccount(t, 'banned-person');
    const blocked = await createAuthAccount(t, 'blocked-person');
    const privatePerson = await createAuthAccount(t, 'private-person');
    const missing = await createAuthAccount(t, 'deleted-profile');
    await t.run(async ctx => {
      await ctx.db.insert('memberships', {
        personId: member.personId,
        eventId,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      });
      await ctx.db.insert('eventBans', {
        personId: banned.personId,
        eventId,
        bannedAt: Date.now(),
        bannedById: owner.personId,
      });
      await ctx.db.insert('personSettings', {
        personId: privatePerson.personId,
        allowEventInvitesFrom: 'NO_ONE',
      });
    });
    await blocked.auth.mutation(api.friends.mutations.blockUser, {
      personId: owner.personId,
    });
    await owner.auth.mutation(api.eventInvites.mutations.sendEventInvite, {
      eventId,
      inviteePersonId: pending.personId,
      role: 'ATTENDEE',
    });
    await t.mutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: missing.user._id }],
      },
    });
    const personIds = [
      recipient.personId,
      member.personId,
      pending.personId,
      banned.personId,
      blocked.personId,
      privatePerson.personId,
      missing.personId,
      owner.personId,
    ];
    const review = await owner.auth.query(
      api.inviteLists.queries.reviewInviteListRecipients,
      { eventId, personIds }
    );
    expect(review).toMatchObject({
      totalCount: 8,
      eligibleCount: 1,
      skippedCount: 7,
    });
    expect(review.results[6]).toEqual({
      personId: missing.personId,
      name: null,
      username: null,
      image: null,
      available: false,
      status: 'skipped',
      reason: 'UNAVAILABLE',
    });
    const result = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      { eventId, personIds, requestId: requestId() }
    );
    expect(result).toMatchObject({
      totalCount: 8,
      sentCount: 1,
      skippedCount: 7,
    });
    expect(result.results.slice(1)).toEqual([
      {
        personId: member.personId,
        status: 'skipped',
        reason: 'ALREADY_MEMBER',
      },
      {
        personId: pending.personId,
        status: 'skipped',
        reason: 'INVITATION_PENDING',
      },
      ...[
        banned.personId,
        blocked.personId,
        privatePerson.personId,
        missing.personId,
        owner.personId,
      ].map(personId => ({
        personId,
        status: 'skipped',
        reason: 'UNAVAILABLE',
      })),
    ]);
    const zero = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      { eventId, personIds, requestId: requestId() }
    );
    expect(zero).toMatchObject({
      totalCount: 8,
      sentCount: 0,
      skippedCount: 8,
    });
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
    expect(
      (
        await pending.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
  });
  it('preserves the reviewed recipient snapshot while rechecking changed eligibility at send', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const replacement = await createAuthAccount(t, 'replacement-person');
    const eligible = await createAuthAccount(t, 'still-eligible');
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Snapshot', personIds: [recipient.personId, eligible.personId] }
    );
    const reviewed = await owner.auth.query(
      api.inviteLists.queries.reviewInviteListRecipients,
      { eventId, personIds: list.people.map(person => person.personId) }
    );
    expect(reviewed.eligibleCount).toBe(2);
    await owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
      inviteListId: list.inviteListId,
      personIds: [replacement.personId],
    });
    await recipient.auth.mutation(api.friends.mutations.blockUser, {
      personId: owner.personId,
    });
    const result = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      {
        eventId,
        personIds: reviewed.results.map(person => person.personId),
        requestId: requestId(),
      }
    );
    expect(result.results).toMatchObject([
      {
        personId: recipient.personId,
        status: 'skipped',
        reason: 'UNAVAILABLE',
      },
      { personId: eligible.personId, status: 'sent' },
    ]);
    expect(
      await replacement.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
  });
  it('rejects oversized/empty sends and invalid message/request identifiers before writing invitations', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const people = [recipient.personId];
    for (let i = 0; i < 100; i++)
      people.push((await createAuthAccount(t, `send-limit-${i}`)).personId);
    const send = (
      personIds: typeof people,
      message?: string,
      id = requestId()
    ) =>
      owner.auth.mutation(api.inviteLists.mutations.sendInviteListRecipients, {
        eventId,
        personIds,
        message,
        requestId: id,
      });
    await expect(send(people)).rejects.toThrow('100 distinct recipients');
    await expect(
      owner.auth.query(api.inviteLists.queries.reviewInviteListRecipients, {
        eventId,
        personIds: people,
      })
    ).rejects.toThrow('100 distinct recipients');
    await expect(send([])).rejects.toThrow('at least one recipient');
    await expect(send([recipient.personId], 'x'.repeat(481))).rejects.toThrow(
      '480 characters'
    );
    await expect(
      send([recipient.personId], undefined, 'bad-request-id')
    ).rejects.toThrow('unix-ms');
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(0);
    expect(
      (await send(Array(101).fill(recipient.personId), 'x'.repeat(480)))
        .sentCount
    ).toBe(1);
  });
  it('expands current owned people once and replays the original outcome after list edits and deletion', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const added = await createAuthAccount(t, 'later-added-person');
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Current list', personIds: [recipient.personId] }
    );
    const args = {
      inviteListId: list.inviteListId,
      eventId,
      requestId: requestId(),
    };
    const first = await owner.auth.mutation(
      api.inviteLists.mutations.inviteListToEvent,
      args
    );
    expect(first).toMatchObject({
      sentCount: 1,
      results: [{ personId: recipient.personId, status: 'sent' }],
    });
    await owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
      inviteListId: list.inviteListId,
      personIds: [added.personId],
    });
    expect(
      await owner.auth.mutation(
        api.inviteLists.mutations.inviteListToEvent,
        args
      )
    ).toEqual(first);
    await owner.auth.mutation(api.inviteLists.mutations.deleteInviteList, {
      inviteListId: list.inviteListId,
    });
    expect(
      await owner.auth.mutation(
        api.inviteLists.mutations.inviteListToEvent,
        args
      )
    ).toEqual(first);
    expect(
      await added.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toHaveLength(1);
  });
  it('protects concurrent snapshot retries with one invitation and notification, conflicts and 24-hour expiry', async () => {
    const { t, owner, recipient, eventId } = await setup();
    const args = {
      eventId,
      personIds: [recipient.personId],
      requestId: requestId(),
    };
    const [first, second] = await Promise.all([
      owner.auth.mutation(
        api.inviteLists.mutations.sendInviteListRecipients,
        args
      ),
      owner.auth.mutation(
        api.inviteLists.mutations.sendInviteListRecipients,
        args
      ),
    ]);
    expect(second).toEqual(first);
    expect(first.sentCount).toBe(1);
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.sendInviteListRecipients, {
        ...args,
        message: 'Changed',
      })
    ).rejects.toThrow('different invitation input');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'session',
        where: [{ field: '_id', value: owner.session._id }],
        update: { expiresAt: Date.now() + 3 * 86400000 },
      },
    });
    vi.setSystemTime(Date.now() + 86400000);
    await expect(
      owner.auth.mutation(
        api.inviteLists.mutations.sendInviteListRecipients,
        args
      )
    ).rejects.toThrow('expired after 24 hours');
  });
  it('explicitly sends the reviewed unique snapshot as ordinary pending invitations without membership', async () => {
    const { owner, recipient, eventId } = await setup();
    const result = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      {
        eventId,
        personIds: [recipient.personId, recipient.personId],
        requestId: requestId(),
      }
    );
    expect(result).toMatchObject({
      eventId,
      totalCount: 1,
      sentCount: 1,
      skippedCount: 0,
      results: [{ personId: recipient.personId, status: 'sent' }],
    });
    const pending = await recipient.auth.query(
      api.eventInvites.queries.getPendingEventInvites,
      {}
    );
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      inviteId: result.results[0].inviteId,
      role: 'ATTENDEE',
      eventId,
    });
    expect(
      await recipient.auth.query(api.events.queries.getUserEvents, {})
    ).toMatchObject({ events: [] });
    const notices = await recipient.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(notices.notifications).toHaveLength(1);
    expect(notices.notifications[0].type).toBe('EVENT_INVITE_RECEIVED');
    await recipient.auth.mutation(
      api.eventInvites.mutations.acceptEventInvite,
      { inviteId: pending[0].inviteId }
    );
    expect(
      (
        await recipient.auth.query(api.events.queries.getEventHeader, {
          eventId,
        })
      ).userMembership.rsvpStatus
    ).toBe('PENDING');
  });
  it('reviews unique current people without sending and marks visible members skipped', async () => {
    const { owner, recipient, eventId } = await setup();
    const result = await owner.auth.query(
      api.inviteLists.queries.reviewInviteListRecipients,
      {
        eventId,
        personIds: [recipient.personId, owner.personId, recipient.personId],
      }
    );
    expect(result).toEqual({
      eventId,
      totalCount: 2,
      eligibleCount: 1,
      skippedCount: 1,
      results: [
        {
          personId: recipient.personId,
          name: 'list-invitee',
          username: 'list-invitee',
          image: null,
          available: true,
          status: 'eligible',
        },
        {
          personId: owner.personId,
          name: 'list-inviter',
          username: 'list-inviter',
          image: null,
          available: true,
          status: 'skipped',
          reason: 'UNAVAILABLE',
        },
      ],
    });
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
    expect(
      await recipient.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).toMatchObject({ notifications: [] });
  });
});

import { it, expect, vi, afterEach } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
afterEach(() => vi.useRealTimers());
it('shares safe Group logistics without participation and revokes only the withdrawn grant', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'audience-owner');
  const viewer = await createAuthAccount(t, 'audience-viewer');
  const outsider = await createAuthAccount(t, 'audience-outsider');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Readers',
  });
  const offer = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: offer.inviteId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Independent event', location: 'Library', visibility: 'PRIVATE' }
  );
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'DIRECT',
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId }
  );
  const privateGroup = await owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Another private community' }
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId: privateGroup }
  );
  expect(
    (
      await viewer.auth.query(
        api.groupEventAudiences.queries.getEventAudiences,
        { eventId }
      )
    ).groups
  ).toEqual([{ groupId, name: 'Readers', canWithdraw: false }]);
  const read = await viewer.auth.query(api.events.queries.getEventLogistics, {
    eventId,
  });
  expect(read).toMatchObject({
    event: { title: 'Independent event', location: 'Library' },
    entryAction: 'JOIN',
  });
  expect(read).not.toHaveProperty('members');
  await expect(
    outsider.auth.query(api.events.queries.getEventLogistics, { eventId })
  ).rejects.toThrow();
  const preview = await viewer.auth.query(
    api.groupEventAudiences.queries.listGroupSharedEvents,
    { groupId, paginationOpts: { numItems: 1, cursor: null } }
  );
  expect(preview.page[0]).toMatchObject({
    event: { _id: eventId, title: 'Independent event' },
    canWithdraw: false,
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { eventId, groupId }
  );
  await expect(
    viewer.auth.query(api.events.queries.getEventLogistics, { eventId })
  ).rejects.toThrow();
  await expect(
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    })
  ).rejects.toThrow();
  expect(
    await t.run(ctx =>
      ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect()
    )
  ).toHaveLength(1);
  expect(
    await t.run(ctx =>
      ctx.db
        .query('invites')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect()
    )
  ).toHaveLength(0);
});
it('combines eligible Groups and Friends by OR while onboarding revokes only its own grant and unchanged visibility preserves explicit Friends', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'or-owner'),
    viewer = await createAuthAccount(t, 'or-viewer');
  const groups = [];
  for (const name of ['First', 'Second']) {
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name }
    );
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: viewer.personId }
    );
    await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: offer.inviteId,
    });
    groups.push(groupId);
  }
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Overlapping', visibility: 'PRIVATE' }
  );
  for (const groupId of groups)
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    );
  const config = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId: groups[0],
      enabled: true,
      requiredCompletion: true,
      questions: [
        { id: 'book', label: 'Book', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  expect(
    (await viewer.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .event.title
  ).toBe('Overlapping');
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { eventId, groupId: groups[1] }
  );
  await expect(
    viewer.auth.query(api.events.queries.getEventLogistics, { eventId })
  ).rejects.toThrow();
  await viewer.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    { groupId: groups[0], version: config.version, answers: { book: 'Dune' } }
  );
  expect(
    (await viewer.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .event.title
  ).toBe('Overlapping');
  const request = await owner.auth.mutation(
    api.friends.mutations.sendFriendRequest,
    { addresseePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.friends.mutations.acceptFriendRequest, {
    friendshipId: request.friendshipId,
  });
  const { eventId: legacyEvent } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Legacy Friends', visibility: 'FRIENDS' }
  );
  expect(
    (
      await viewer.auth.query(api.events.queries.getEventLogistics, {
        eventId: legacyEvent,
      })
    ).entryAction
  ).toBe('JOIN');
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.setEventFriendsAudience,
    { eventId: legacyEvent, enabled: false }
  );
  await owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId: legacyEvent,
    visibility: 'FRIENDS',
    title: 'Unchanged Friends mode',
  });
  await expect(
    viewer.auth.query(api.events.queries.getEventLogistics, {
      eventId: legacyEvent,
    })
  ).rejects.toThrow();
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.setEventFriendsAudience,
    { eventId, enabled: true }
  );
  await owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId,
    title: 'Edited',
    visibility: 'PRIVATE',
  });
  await viewer.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: groups[0],
  });
  expect(
    (await viewer.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .event.title
  ).toBe('Edited');
  expect(
    await owner.auth.query(api.groupEventAudiences.queries.getEventAudiences, {
      eventId,
    })
  ).toMatchObject({ friendsShared: true });
  await owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId,
    visibility: 'FRIENDS',
  });
  await owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId,
    visibility: 'PRIVATE',
  });
  await expect(
    viewer.auth.query(api.events.queries.getEventLogistics, { eventId })
  ).rejects.toThrow();
  await owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId,
    visibility: 'PUBLIC',
  });
  expect(
    (await viewer.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .event.visibility
  ).toBe('PUBLIC');
});
it('requires both authorities, honors owner sharing policy and lets managers withdraw only their own grant', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'policy-owner'),
    member = await createAuthAccount(t, 'policy-member');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Policy',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const { eventId } = await member.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Member-owned', visibility: 'PRIVATE' }
  );
  await expect(
    member.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    )
  ).rejects.toThrow('sharing permission');
  await expect(
    owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, {
      eventId,
      groupId,
    })
  ).rejects.toThrow();
  await expect(
    member.auth.mutation(
      api.groupEventAudiences.mutations.configureGroupEventSharing,
      { groupId, policy: 'MEMBERS' }
    )
  ).rejects.toThrow();
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.configureGroupEventSharing,
    { groupId, policy: 'MEMBERS' }
  );
  await Promise.all([
    member.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    ),
    member.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    ),
  ]);
  expect(
    await owner.auth.query(api.groupEventAudiences.queries.getEventAudiences, {
      eventId,
    })
  ).toMatchObject({
    canManageEvent: false,
    friendsShared: null,
    groups: [{ groupId, canWithdraw: true }],
  });
  await expect(
    owner.auth.mutation(api.events.mutations.deleteEvent, { eventId })
  ).rejects.toThrow();
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { eventId, groupId }
  );
  expect(
    (
      await member.auth.query(
        api.groupEventAudiences.queries.getEventAudiences,
        { eventId }
      )
    ).groups
  ).toHaveLength(0);
  expect(
    await t.run(ctx => ctx.db.query('groupEventAudiences').collect())
  ).toHaveLength(0);
});
it('preserves independent Event memberships, RSVP and manager invitations after Group bans and deletion', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'independent-owner'),
    member = await createAuthAccount(t, 'independent-member'),
    invited = await createAuthAccount(t, 'independent-invited');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Independent participation',
  });
  const offer = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: offer.inviteId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    {
      title: 'Participation',
      chosenDateTime: new Date(Date.now() + 86400000).toISOString(),
      visibility: 'PRIVATE',
    }
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId }
  );
  const eventOffer = await owner.auth.mutation(
    api.eventInvites.mutations.sendEventInvite,
    { eventId, inviteePersonId: member.personId, role: 'ATTENDEE' }
  );
  await member.auth.mutation(api.eventInvites.mutations.acceptEventInvite, {
    inviteId: eventOffer.inviteId,
  });
  const pending = await owner.auth.mutation(
    api.eventInvites.mutations.sendEventInvite,
    { eventId, inviteePersonId: invited.personId, role: 'ATTENDEE' }
  );
  await member.auth.mutation(api.events.mutations.updateRSVP, {
    eventId,
    rsvpStatus: 'YES',
  });
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: member.personId,
  });
  expect(
    (await member.auth.query(api.events.queries.getEventHeader, { eventId }))
      .userMembership
  ).toMatchObject({ role: 'ATTENDEE', rsvpStatus: 'YES' });
  await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
  expect(
    (await member.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .entryAction
  ).toBe('MEMBER');
  expect(
    (await member.auth.query(api.events.queries.getEventHeader, { eventId }))
      .userMembership.rsvpStatus
  ).toBe('YES');
  expect(await t.run(ctx => ctx.db.get(pending.inviteId))).toMatchObject({
    status: 'PENDING',
  });
});
it('bounds selection to 100 Groups, keeps duplicate sharing idempotent and allows replacement after withdrawal', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'bounded-audience-owner');
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Bounded audiences' }
  );
  const groups = [];
  for (let index = 0; index < 101; index++) {
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: `Selection ${index}` }
    );
    groups.push(groupId);
    if (index < 100)
      await owner.auth.mutation(
        api.groupEventAudiences.mutations.shareEventWithGroup,
        { groupId, eventId }
      );
  }
  await expect(
    owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, {
      groupId: groups[100],
      eventId,
    })
  ).rejects.toThrow('100 whole Groups');
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: groups[0], eventId }
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { groupId: groups[0], eventId }
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: groups[100], eventId }
  );
  expect(
    (
      await owner.auth.query(
        api.groupEventAudiences.queries.getEventAudiences,
        { eventId }
      )
    ).groups
  ).toHaveLength(100);
});

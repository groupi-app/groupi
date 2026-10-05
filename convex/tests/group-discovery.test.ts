import { it, expect, vi, afterEach } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
afterEach(() => vi.useRealTimers());
it('discovers a current Group grant without friends and enters once as a pending attendee through safe logistics', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'discovery-owner');
  const viewer = await createAuthAccount(t, 'discovery-viewer');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Readers',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Undated gathering', visibility: 'PRIVATE' }
  );
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'DIRECT',
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId }
  );
  const discovery = await viewer.auth.query(
    api.events.queries.getDiscoverableEvents,
    {}
  );
  expect(discovery).toEqual([
    expect.objectContaining({
      eventId,
      entryAction: 'JOIN',
      accessReasons: { friends: false, groups: [{ groupId, name: 'Readers' }] },
    }),
  ]);
  expect(
    (await viewer.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .entryAction
  ).toBe('JOIN');
  const joined = await viewer.auth.mutation(
    api.events.mutations.joinDiscoverableEvent,
    { eventId }
  );
  expect(joined).toMatchObject({
    role: 'ATTENDEE',
    rsvpStatus: 'PENDING',
    success: true,
  });
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toEqual([]);
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { eventId, groupId }
  );
  expect(
    (await viewer.auth.query(api.events.queries.getEventLogistics, { eventId }))
      .entryAction
  ).toBe('MEMBER');
});

it('deduplicates overlap and keeps only viewer-applicable reasons, with independent Friends recovery', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'or-discover-owner'),
    viewer = await createAuthAccount(t, 'or-discover-viewer');
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Overlap', visibility: 'PRIVATE' }
  );
  const groups = [];
  for (const name of ['First', 'Second', 'Secret']) {
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name }
    );
    if (name !== 'Secret') {
      const offer = await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId, inviteePersonId: viewer.personId }
      );
      await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: offer.inviteId,
      });
      groups.push({ groupId, name });
    }
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    );
  }
  const friendship = await owner.auth.mutation(
    api.friends.mutations.sendFriendRequest,
    { addresseePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.friends.mutations.acceptFriendRequest, {
    friendshipId: friendship.friendshipId,
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.setEventFriendsAudience,
    { eventId, enabled: true }
  );
  let rows = await viewer.auth.query(
    api.events.queries.getDiscoverableEvents,
    {}
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].accessReasons).toEqual({ friends: true, groups });
  for (const { groupId } of groups)
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.withdrawGroupEventAudience,
      { eventId, groupId }
    );
  rows = await viewer.auth.query(api.events.queries.getDiscoverableEvents, {});
  expect(rows).toHaveLength(1);
  expect(rows[0].accessReasons).toEqual({ friends: true, groups: [] });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.setEventFriendsAudience,
    { eventId, enabled: false }
  );
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toEqual([]);
});

it('rechecks required onboarding and policy at direct admission, recovers dynamically, and keeps Group-only Apply unavailable', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'gated-owner'),
    viewer = await createAuthAccount(t, 'gated-viewer');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Gated',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Gate', visibility: 'PRIVATE' }
  );
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'DIRECT',
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId }
  );
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toHaveLength(1);
  const form = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        { id: 'book', label: 'Book', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toEqual([]);
  await expect(
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    })
  ).rejects.toThrow();
  await viewer.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    { groupId, version: form.version, answers: { book: 'Dune' } }
  );
  expect(
    (await viewer.auth.query(api.events.queries.getDiscoverableEvents, {}))[0]
      .entryAction
  ).toBe('JOIN');
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'APPLY',
  });
  expect(
    (await viewer.auth.query(api.events.queries.getDiscoverableEvents, {}))[0]
      .entryAction
  ).toBe('UNAVAILABLE');
  await expect(
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    })
  ).rejects.toThrow();
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'INVITATION_ONLY',
  });
  expect(
    (await viewer.auth.query(api.events.queries.getDiscoverableEvents, {}))[0]
      .entryAction
  ).toBe('INVITATION_ONLY');
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: viewer.personId,
  });
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toEqual([]);
  await expect(
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    })
  ).rejects.toThrow();
});

it('excludes past chosen dates and Public-only Events while including undated and upcoming current grants', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'dated-owner'),
    viewer = await createAuthAccount(t, 'dated-viewer');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Dates',
  });
  const offer = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: offer.inviteId,
  });
  for (const [title, chosenDateTime] of [
    ['Past', Date.now() + 1000],
    ['Future', Date.now() + 100000],
    ['Undated', undefined],
  ] as const) {
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      {
        title,
        visibility: 'PRIVATE',
        ...(chosenDateTime === undefined
          ? {}
          : { chosenDateTime: new Date(chosenDateTime).toISOString() }),
      }
    );
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    );
  }
  await owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'Public is not a directory',
    visibility: 'PUBLIC',
  });
  vi.setSystemTime(Date.now() + 2000);
  expect(
    (await viewer.auth.query(api.events.queries.getDiscoverableEvents, {}))
      .map(event => event.title)
      .sort()
  ).toEqual(['Future', 'Undated']);
});

it('rechecks bilateral blocks and Event bans despite an eligible Group grant and creates one Pending membership under repeated admission', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'join-recheck-owner'),
    viewer = await createAuthAccount(t, 'join-recheck-viewer');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Entry',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: viewer.personId }
  );
  await viewer.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Direct entry', visibility: 'PRIVATE' }
  );
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'DIRECT',
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId }
  );
  await owner.auth.mutation(api.friends.mutations.blockUser, {
    personId: viewer.personId,
  });
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toEqual([]);
  await expect(
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    })
  ).rejects.toThrow();
  await owner.auth.mutation(api.friends.mutations.unblockUser, {
    personId: viewer.personId,
  });
  const outcomes = await Promise.allSettled([
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    }),
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    }),
  ]);
  expect(outcomes.filter(value => value.status === 'fulfilled')).toHaveLength(
    1
  );
  const header = await viewer.auth.query(api.events.queries.getEventHeader, {
    eventId,
  });
  expect(header.userMembership).toMatchObject({
    role: 'ATTENDEE',
    rsvpStatus: 'PENDING',
  });
  expect(header.event.memberCount).toBe(2);
  await owner.auth.mutation(api.events.mutations.banMember, {
    membershipId: header.userMembership._id,
  });
  expect(
    await viewer.auth.query(api.events.queries.getDiscoverableEvents, {})
  ).toEqual([]);
  await expect(
    viewer.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId,
    })
  ).rejects.toThrow();
});

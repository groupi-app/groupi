import { afterEach, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

afterEach(() => vi.useRealTimers());
async function fixture() {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'group-apply-owner');
  const applicant = await createAuthAccount(t, 'group-apply-applicant');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Readers',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: applicant.personId }
  );
  await applicant.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Group application Event', visibility: 'PRIVATE' }
  );
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'APPLY',
  });
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId, groupId }
  );
  return { t, owner, applicant, groupId, eventId };
}

it('a current Group audience exposes Apply and approval admits once independently of later Group loss', async () => {
  const f = await fixture();
  expect(
    await f.applicant.auth.query(api.events.queries.getEventLogistics, {
      eventId: f.eventId,
    })
  ).toMatchObject({ entryAction: 'APPLY' });
  const request = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: {} }
  );
  expect(
    await f.applicant.auth.query(api.eventApplications.queries.getForm, {
      eventId: f.eventId,
    })
  ).toMatchObject({ canApply: true, pending: { _id: request.applicationId } });
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: request.applicationId,
    decision: 'APPROVED',
  });
  await f.applicant.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  expect(
    await f.applicant.auth.query(api.events.queries.getEventLogistics, {
      eventId: f.eventId,
    })
  ).toMatchObject({ entryAction: 'MEMBER' });
  expect(
    await f.applicant.auth.query(api.eventApplications.queries.history, {
      eventId: f.eventId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).toMatchObject({ page: [{ status: 'APPROVED' }] });
  expect(
    await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).toMatchObject({ status: 'APPROVED' });
});

it('loss of the only Group path blocks stale approval while own snapshots remain private and readable', async () => {
  const f = await fixture();
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    questions: [
      { id: 'why', label: 'Why attend?', type: 'SHORT_ANSWER', required: true },
    ],
    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
  });
  const request = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Learn' } }
  );
  await f.applicant.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    questions: [
      {
        id: 'private',
        label: 'Current private setting',
        type: 'SHORT_ANSWER',
        required: true,
      },
    ],
    reviewerPolicy: 'ORGANIZER_ONLY',
  });
  await expect(
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow('Applicant is no longer eligible');
  const form = await f.applicant.auth.query(
    api.eventApplications.queries.getForm,
    { eventId: f.eventId }
  );
  expect(form).toMatchObject({
    settings: null,
    canApply: false,
    pending: {
      answers: { why: 'Learn' },
      questions: [{ label: 'Why attend?' }],
    },
  });
  await f.applicant.auth.mutation(api.eventApplications.mutations.withdraw, {
    applicationId: request.applicationId,
  });
  expect(
    await f.applicant.auth.query(api.eventApplications.queries.getForm, {
      eventId: f.eventId,
    })
  ).toMatchObject({ settings: null, pending: null });
  expect(
    await f.applicant.auth.query(api.eventApplications.queries.history, {
      eventId: f.eventId,
      paginationOpts: { cursor: null, numItems: 20 },
    })
  ).toMatchObject({
    page: [{ status: 'WITHDRAWN', answers: { why: 'Learn' } }],
  });
});

it.each(['remove', 'ban', 'withdraw', 'retire', 'require onboarding'] as const)(
  '%s revokes submission and stale review through the actual Group boundary',
  async change => {
    const f = await fixture();
    const request = await f.applicant.auth.mutation(
      api.eventApplications.mutations.submit,
      { eventId: f.eventId, answers: {} }
    );
    if (change === 'remove')
      await f.owner.auth.mutation(
        api.groupModeration.mutations.removeGroupMember,
        { groupId: f.groupId, personId: f.applicant.personId }
      );
    if (change === 'ban')
      await f.owner.auth.mutation(
        api.groupModeration.mutations.banGroupPerson,
        { groupId: f.groupId, personId: f.applicant.personId }
      );
    if (change === 'withdraw')
      await f.owner.auth.mutation(
        api.groupEventAudiences.mutations.withdrawGroupEventAudience,
        { groupId: f.groupId, eventId: f.eventId }
      );
    if (change === 'retire')
      await f.owner.auth.mutation(api.groups.mutations.deleteGroup, {
        groupId: f.groupId,
      });
    if (change === 'require onboarding')
      await f.owner.auth.mutation(
        api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
        {
          groupId: f.groupId,
          enabled: true,
          requiredCompletion: true,
          questions: [
            {
              id: 'consent',
              label: 'Community agreement',
              type: 'YES_NO',
              required: true,
            },
          ],
        }
      );
    await expect(
      f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
        eventId: f.eventId,
        answers: {},
      })
    ).rejects.toThrow('not currently eligible');
    await expect(
      f.owner.auth.mutation(api.eventApplications.mutations.decide, {
        applicationId: request.applicationId,
        decision: 'APPROVED',
      })
    ).rejects.toThrow('no longer eligible');
    expect(
      await f.applicant.auth.query(api.eventApplications.queries.history, {
        eventId: f.eventId,
        paginationOpts: { cursor: null, numItems: 20 },
      })
    ).toMatchObject({ page: [{ status: 'PENDING' }] });
  }
);

it.each(['GROUP', 'PUBLIC', 'FRIENDS'] as const)(
  'a second independent %s audience rescues approval after the original Group is lost',
  async rescue => {
    const f = await fixture();
    const request = await f.applicant.auth.mutation(
      api.eventApplications.mutations.submit,
      { eventId: f.eventId, answers: {} }
    );
    if (rescue === 'PUBLIC')
      await f.owner.auth.mutation(api.events.mutations.updateEvent, {
        eventId: f.eventId,
        visibility: 'PUBLIC',
      });
    else if (rescue === 'FRIENDS') {
      const friendship = await f.owner.auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: f.applicant.personId }
      );
      await f.applicant.auth.mutation(
        api.friends.mutations.acceptFriendRequest,
        { friendshipId: friendship.friendshipId }
      );
      await f.owner.auth.mutation(
        api.groupEventAudiences.mutations.setEventFriendsAudience,
        { eventId: f.eventId, enabled: true }
      );
    } else {
      const groupId = await f.owner.auth.mutation(
        api.groups.mutations.createGroup,
        { name: 'Independent audience' }
      );
      const invite = await f.owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId, inviteePersonId: f.applicant.personId }
      );
      await f.applicant.auth.mutation(
        api.groupInvites.mutations.acceptGroupInvite,
        { inviteId: invite.inviteId }
      );
      await f.owner.auth.mutation(
        api.groupEventAudiences.mutations.shareEventWithGroup,
        { eventId: f.eventId, groupId }
      );
    }
    await f.applicant.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId: f.groupId,
    });
    expect(
      await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
        applicationId: request.applicationId,
        decision: 'APPROVED',
      })
    ).toMatchObject({ status: 'APPROVED' });
    expect(
      await f.applicant.auth.query(api.events.queries.getEventHeader, {
        eventId: f.eventId,
      })
    ).toMatchObject({
      userMembership: { role: 'ATTENDEE', rsvpStatus: 'PENDING' },
    });
  }
);

it('material required-onboarding edits invalidate approval until current completion while disabling the gate restores eligibility', async () => {
  const f = await fixture();
  const question = {
    id: 'consent',
    label: 'Agreement',
    type: 'YES_NO' as const,
    required: true,
  };
  const config = await f.owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId: f.groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [question],
    }
  );
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: {},
    })
  ).rejects.toThrow();
  await f.applicant.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    { groupId: f.groupId, version: config.version, answers: { consent: true } }
  );
  const request = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: {} }
  );
  await f.owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId: f.groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        question,
        {
          id: 'new',
          label: 'New required answer',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    }
  );
  await expect(
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow('no longer eligible');
  await f.owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId: f.groupId, enabled: false, questions: [] }
  );
  expect(
    await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).toMatchObject({ status: 'APPROVED' });
});

it('Group manager authority never reviews Events and an explicit Event invitation does not rescue stale application approval', async () => {
  const f = await fixture();
  const manager = await createAuthAccount(f.t, 'group-only-reviewer');
  const groupInvite = await f.owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId: f.groupId, inviteePersonId: manager.personId }
  );
  await manager.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: groupInvite.inviteId,
  });
  await f.owner.auth.mutation(
    api.groupModeration.mutations.setGroupMemberRole,
    { groupId: f.groupId, personId: manager.personId, role: 'MODERATOR' }
  );
  const request = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: {} }
  );
  await expect(
    manager.auth.query(api.eventApplications.queries.list, {
      eventId: f.eventId,
      paginationOpts: { cursor: null, numItems: 20 },
    })
  ).rejects.toThrow('review is not permitted');
  await expect(
    manager.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow('review is not permitted');
  await f.applicant.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  const eventInvite = await f.owner.auth.mutation(
    api.invites.mutations.createInvite,
    { eventId: f.eventId }
  );
  await f.applicant.auth.mutation(api.invites.mutations.acceptInvite, {
    token: eventInvite.invite.token,
  });
  await expect(
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow('no longer eligible');
  expect(
    await f.applicant.auth.query(api.events.queries.getEventHeader, {
      eventId: f.eventId,
    })
  ).toMatchObject({
    userMembership: { role: 'ATTENDEE', rsvpStatus: 'PENDING' },
  });
});

it.each(['blocked', 'banned account'] as const)(
  'approval rechecks %s after a Group application was submitted',
  async condition => {
    const f = await fixture();
    const request = await f.applicant.auth.mutation(
      api.eventApplications.mutations.submit,
      { eventId: f.eventId, answers: {} }
    );
    if (condition === 'blocked')
      await f.owner.auth.mutation(api.friends.mutations.blockUser, {
        personId: f.applicant.personId,
      });
    else
      await f.t.mutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: 'user',
          where: [{ field: '_id', value: f.applicant.user._id }],
          update: { banned: true, banExpires: Date.now() + 60000 },
        },
      });
    await expect(
      f.owner.auth.mutation(api.eventApplications.mutations.decide, {
        applicationId: request.applicationId,
        decision: 'APPROVED',
      })
    ).rejects.toThrow();
    expect(
      await f.owner.auth.query(api.eventApplications.queries.list, {
        eventId: f.eventId,
        paginationOpts: { cursor: null, numItems: 20 },
      })
    ).toMatchObject({ page: [{ status: 'PENDING' }] });
  }
);

it('an Event ban defeats a still-valid Group path and terminal approval replay never readmits a departed member', async () => {
  const f = await fixture();
  const request = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: {} }
  );
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: request.applicationId,
    decision: 'APPROVED',
  });
  const header = await f.applicant.auth.query(
    api.events.queries.getEventHeader,
    { eventId: f.eventId }
  );
  await f.owner.auth.mutation(api.events.mutations.banMember, {
    membershipId: header.userMembership._id,
  });
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: {},
    })
  ).rejects.toThrow('not currently eligible');
  expect(
    await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: request.applicationId,
      decision: 'APPROVED',
    })
  ).toMatchObject({ status: 'APPROVED' });
  await expect(
    f.applicant.auth.query(api.events.queries.getEventHeader, {
      eventId: f.eventId,
    })
  ).rejects.toThrow();
  expect(
    await f.applicant.auth.query(api.eventApplications.queries.history, {
      eventId: f.eventId,
      paginationOpts: { cursor: null, numItems: 20 },
    })
  ).toMatchObject({ page: [{ status: 'APPROVED' }] });
});

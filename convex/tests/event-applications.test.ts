import { afterEach, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

afterEach(() => vi.useRealTimers());
async function fixture() {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'application-owner');
  const applicant = await createAuthAccount(t, 'application-author');
  const outsider = await createAuthAccount(t, 'application-outsider');
  const eventId = await t.run(async ctx => {
    const eventId = await ctx.db.insert('events', {
      title: 'Applications',
      creatorId: owner.personId,
      timezone: 'UTC',
      potentialDateTimes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visibility: 'PUBLIC',
    });
    await ctx.db.insert('memberships', {
      eventId,
      personId: owner.personId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
      updatedAt: Date.now(),
    });
    return eventId;
  });
  const questions = [
    {
      id: 'why',
      type: 'LONG_ANSWER' as const,
      label: 'Why attend?',
      required: true,
    },
  ];
  await owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId,
    questions,
    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
  });
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'APPLY',
  });
  return { t, owner, applicant, outsider, eventId, questions };
}
it('validates answers, retains snapshots and private history, then approves once with ordinary pending membership', async () => {
  const f = await fixture();
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: {},
    })
  ).rejects.toThrow();
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: { why: '   ' },
    })
  ).rejects.toThrow();
  const submitted = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Learn' } }
  );
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    questions: [],
    reviewerPolicy: 'ORGANIZER_ONLY',
  });
  const form = await f.applicant.auth.query(
    api.eventApplications.queries.history,
    { eventId: f.eventId, paginationOpts: { numItems: 20, cursor: null } }
  );
  expect(form.page[0].questions).toEqual(f.questions);
  expect(form.page[0]).not.toHaveProperty('applicant');
  const review = await f.owner.auth.query(api.eventApplications.queries.list, {
    eventId: f.eventId,
    paginationOpts: { numItems: 20, cursor: null },
  });
  expect(review.page[0].applicant.name).toBe('application-author');
  expect(
    (
      await f.outsider.auth.query(api.eventApplications.queries.history, {
        eventId: f.eventId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toEqual([]);
  await expect(
    f.outsider.auth.query(api.eventApplications.queries.list, {
      eventId: f.eventId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).rejects.toThrow();
  const decision = await f.owner.auth.mutation(
    api.eventApplications.mutations.decide,
    { applicationId: submitted.applicationId, decision: 'APPROVED' }
  );
  expect(decision.status).toBe('APPROVED');
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: submitted.applicationId,
    decision: 'APPROVED',
  });
  const member = await f.applicant.auth.query(
    api.events.queries.getEventHeader,
    { eventId: f.eventId }
  );
  expect(member.userMembership).toMatchObject({
    role: 'ATTENDEE',
    rsvpStatus: 'PENDING',
  });
  const history = (
    await f.applicant.auth.query(api.eventApplications.queries.history, {
      eventId: f.eventId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).page;
  expect(history[0].decisions).toHaveLength(1);
});
it('edits one pending application, withdraws and reapplies, and checks eligibility again at approval', async () => {
  const f = await fixture();
  const first = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'First' } }
  );
  const edit = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Edited' } }
  );
  expect(edit.applicationId).toBe(first.applicationId);
  await f.applicant.auth.mutation(api.eventApplications.mutations.withdraw, {
    applicationId: first.applicationId,
  });
  const next = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'New' } }
  );
  expect(next.applicationId).not.toBe(first.applicationId);
  await f.owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId: f.eventId,
    admissionPolicy: 'INVITATION_ONLY',
  });
  await f.t.run(ctx => ctx.db.patch(f.eventId, { visibility: 'PRIVATE' }));
  await expect(
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: next.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow();
});
it('keeps pending definition on edits, validates false/zero/choices, and lets declined applicants reapply', async () => {
  const f = await fixture();
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    reviewerPolicy: 'ORGANIZER_ONLY',
    questions: [
      { id: 'yes', label: 'Yes?', type: 'YES_NO', required: true },
      { id: 'n', label: 'Number', type: 'NUMBER', required: true },
      {
        id: 'choice',
        label: 'Choose',
        type: 'CHECKBOXES',
        required: true,
        options: ['A', 'B'],
      },
    ],
  });
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: { yes: false, n: 0, choice: [] },
    })
  ).rejects.toThrow();
  const a = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { yes: false, n: 0, choice: ['A'] } }
  );
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    reviewerPolicy: 'ORGANIZER_ONLY',
    questions: [],
  });
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: {},
    })
  ).rejects.toThrow();
  await f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
    eventId: f.eventId,
    answers: { yes: true, n: 1, choice: ['B'] },
  });
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: a.applicationId,
    decision: 'DECLINED',
    reason: 'Try again',
  });
  const b = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: {} }
  );
  expect(b.applicationId).not.toBe(a.applicationId);
  const own = await f.applicant.auth.query(
    api.eventApplications.queries.history,
    { eventId: f.eventId, paginationOpts: { numItems: 1, cursor: null } }
  );
  expect(own.page).toHaveLength(1);
  expect(own.isDone).toBe(false);
});
it('uses current Event roles for review and denies banned submission/approval', async () => {
  const f = await fixture();
  const moderator = await createAuthAccount(f.t, 'application-moderator');
  const membershipId = await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.eventId,
      personId: moderator.personId,
      role: 'MODERATOR',
      rsvpStatus: 'YES',
      updatedAt: Date.now(),
    })
  );
  const a = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Learn' } }
  );
  expect(
    (
      await moderator.auth.query(api.eventApplications.queries.list, {
        eventId: f.eventId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toHaveLength(1);
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    questions: [],
    reviewerPolicy: 'ORGANIZER_ONLY',
  });
  await expect(
    moderator.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: a.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow();
  await f.t.run(ctx => ctx.db.patch(membershipId, { role: 'ATTENDEE' }));
  await expect(
    moderator.auth.query(api.eventApplications.queries.list, {
      eventId: f.eventId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).rejects.toThrow();
  await f.t.run(ctx =>
    ctx.db.insert('eventBans', {
      eventId: f.eventId,
      personId: f.applicant.personId,
      bannedById: f.owner.personId,
      bannedAt: Date.now(),
    })
  );
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: { why: 'Again' },
    })
  ).rejects.toThrow();
  await expect(
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: a.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow();
  expect(
    (
      await f.applicant.auth.query(api.eventApplications.queries.getForm, {
        eventId: f.eventId,
      })
    ).pending?._id
  ).toBe(a.applicationId);
});
it('cleans private applications at real ordinary Event and self-account deletion boundaries', async () => {
  const f = await fixture();
  await f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
    eventId: f.eventId,
    answers: { why: 'Private' },
  });
  await f.applicant.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'application-author',
  });
  expect(
    await f.t.run(ctx => ctx.db.query('eventApplications').collect())
  ).toEqual([]);
  await f.outsider.auth.mutation(api.eventApplications.mutations.submit, {
    eventId: f.eventId,
    answers: { why: 'Other' },
  });
  await f.owner.auth.mutation(api.events.mutations.deleteEvent, {
    eventId: f.eventId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('eventApplications').collect())
  ).toEqual([]);
});
it('manager invitation bypasses applications and repeat approval adds no second join notification', async () => {
  const f = await fixture();
  const a = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Learn' } }
  );
  const link = await f.owner.auth.mutation(api.invites.mutations.createInvite, {
    eventId: f.eventId,
  });
  await f.applicant.auth.mutation(api.invites.mutations.acceptInvite, {
    token: link.invite.token,
  });
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: a.applicationId,
    decision: 'APPROVED',
  });
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: a.applicationId,
    decision: 'APPROVED',
  });
  const own = await f.applicant.auth.query(
    api.notifications.queries.fetchNotificationsForPerson,
    {}
  );
  expect(
    own.notifications.filter(n => n.type === 'EVENT_APPLICATION_APPROVED')
  ).toHaveLength(1);
  const queue = await f.owner.auth.query(
    api.notifications.queries.fetchNotificationsForPerson,
    {}
  );
  expect(
    queue.notifications.filter(n => n.type === 'EVENT_APPLICATION_RECEIVED')
  ).toHaveLength(1);
});
it('cleans history/reviewer references through authenticated admin Event and Person deletion', async () => {
  const f = await fixture();
  const admin = await createAuthAccount(f.t, 'application-admin');
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  const a = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Learn' } }
  );
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: a.applicationId,
    decision: 'DECLINED',
  });
  await admin.auth.mutation(api.admin.mutations.deletePerson, {
    personId: f.applicant.personId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('eventApplications').collect())
  ).toEqual([]);
  await f.outsider.auth.mutation(api.eventApplications.mutations.submit, {
    eventId: f.eventId,
    answers: { why: 'Other' },
  });
  await admin.auth.mutation(api.admin.mutations.deleteEvent, {
    eventId: f.eventId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('eventApplications').collect())
  ).toEqual([]);
  expect(
    await f.t.run(ctx => ctx.db.query('eventApplicationActors').collect())
  ).toEqual([]);
});
it('checks Friends eligibility at submission and approval, and approval retries never repeat ordinary join effects', async () => {
  const f = await fixture();
  await f.t.run(ctx => ctx.db.patch(f.eventId, { visibility: 'FRIENDS' }));
  await expect(
    f.applicant.auth.mutation(api.eventApplications.mutations.submit, {
      eventId: f.eventId,
      answers: { why: 'Learn' },
    })
  ).rejects.toThrow();
  const friendshipId = await f.t.run(ctx =>
    ctx.db.insert('friendships', {
      requesterId: f.owner.personId,
      addresseeId: f.applicant.personId,
      status: 'ACCEPTED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
  const a = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Learn' } }
  );
  await f.t.run(ctx => ctx.db.delete(friendshipId));
  await expect(
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: a.applicationId,
      decision: 'APPROVED',
    })
  ).rejects.toThrow();
  await f.t.run(ctx => ctx.db.patch(f.eventId, { visibility: 'PUBLIC' }));
  await Promise.all([
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: a.applicationId,
      decision: 'APPROVED',
    }),
    f.owner.auth.mutation(api.eventApplications.mutations.decide, {
      applicationId: a.applicationId,
      decision: 'APPROVED',
    }),
  ]);
  const notifications = await f.owner.auth.query(
    api.notifications.queries.fetchNotificationsForPerson,
    {}
  );
  expect(
    notifications.notifications.filter(n => n.type === 'USER_JOINED')
  ).toHaveLength(1);
});
it('retains private reviewed answers while erasing a deleted reviewer reference', async () => {
  const f = await fixture();
  const reviewer = await createAuthAccount(f.t, 'application-deleted-reviewer');
  await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.eventId,
      personId: reviewer.personId,
      role: 'MODERATOR',
      rsvpStatus: 'YES',
      updatedAt: Date.now(),
    })
  );
  const a = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: { why: 'Retain' } }
  );
  await reviewer.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: a.applicationId,
    decision: 'DECLINED',
    reason: 'Not this time',
  });
  await reviewer.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'application-deleted-reviewer',
  });
  const history = await f.applicant.auth.query(
    api.eventApplications.queries.history,
    { eventId: f.eventId, paginationOpts: { numItems: 20, cursor: null } }
  );
  expect(history.page[0].answers).toEqual({ why: 'Retain' });
  expect(history.page[0].decisions).toEqual([
    { status: 'DECLINED', reason: 'Not this time', at: expect.any(Number) },
  ]);
  expect(
    await f.t.run(ctx =>
      ctx.db
        .query('eventApplicationActors')
        .withIndex('by_person', q => q.eq('personId', reviewer.personId))
        .collect()
    )
  ).toEqual([]);
});
it('queue notifications honor Organizer-only review and ordinary Event muting', async () => {
  const f = await fixture();
  const moderator = await createAuthAccount(
    f.t,
    'application-notification-moderator'
  );
  await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.eventId,
      personId: moderator.personId,
      role: 'MODERATOR',
      rsvpStatus: 'YES',
      updatedAt: Date.now(),
    })
  );
  await f.owner.auth.mutation(api.eventApplications.mutations.configure, {
    eventId: f.eventId,
    questions: [],
    reviewerPolicy: 'ORGANIZER_ONLY',
  });
  await f.owner.auth.mutation(api.muting.mutations.muteEvent, {
    eventId: f.eventId,
  });
  const application = await f.applicant.auth.mutation(
    api.eventApplications.mutations.submit,
    { eventId: f.eventId, answers: {} }
  );
  for (const actor of [f.owner, moderator])
    expect(
      (
        await actor.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'EVENT_APPLICATION_RECEIVED')
    ).toEqual([]);
  await f.owner.auth.mutation(api.eventApplications.mutations.decide, {
    applicationId: application.applicationId,
    decision: 'DECLINED',
  });
  expect(
    (
      await f.applicant.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications.filter(n => n.type === 'EVENT_APPLICATION_DECLINED')
  ).toHaveLength(1);
});

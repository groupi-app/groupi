import { getPersonWithUser, authComponent, type AuthUserId } from '../auth';
import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { type PaginationOptions } from 'convex/server';
import { eventAdmissionAccess, hasEventAudience } from '../events/admission';
import { checkIsBlocked } from '../lib/privacy';
import { requireWriteRole } from '../events/writes';
import { notifyPerson } from '../lib/notifications';
import { admitAttendeeForPerson } from '../events/management';
import {
  validateAnswers,
  validateQuestions,
} from '../../packages/shared/src/utils/application-questions';
function fail(message: string): never {
  throw new ConvexError({ code: 'FORBIDDEN', message });
}
/** Re-read both durable identities in the operation transaction, after HTTP auth. */
export async function requireActivePerson(
  ctx: QueryCtx,
  personId: Id<'persons'>
) {
  const person = await ctx.db.get(personId);
  if (!person)
    throw new ConvexError({
      code: 'UNAUTHORIZED',
      message: 'Account is unavailable',
    });
  const user = await authComponent.getAnyUserById(
    ctx,
    person.userId as AuthUserId
  );
  if (
    !user ||
    (user.banned && (user.banExpires == null || user.banExpires > Date.now()))
  )
    throw new ConvexError({
      code: 'UNAUTHORIZED',
      message: 'Account is unavailable',
    });
  return person;
}
export async function context(
  ctx: QueryCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  await requireActivePerson(ctx, personId);
  const event = await ctx.db.get(eventId);
  if (!event)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found' });
  const settings = event.applicationSettings ?? {
    questions: [],
    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' as const,
  };
  const access = await eventAdmissionAccess(ctx, event, personId);
  const canReview =
    access.membership?.role === 'ORGANIZER' ||
    (settings.reviewerPolicy === 'ORGANIZERS_AND_MODERATORS' &&
      access.membership?.role === 'MODERATOR');
  return { event, settings, access, canReview };
}
export async function getForm(
  ctx: QueryCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  const { settings, access, canReview } = await context(ctx, eventId, personId);
  const pending = await ctx.db
    .query('eventApplications')
    .withIndex('by_event_person_status', q =>
      q.eq('eventId', eventId).eq('personId', personId).eq('status', 'PENDING')
    )
    .first();
  if (!access.canRead && !pending && !canReview) {
    const previous = await ctx.db
      .query('eventApplications')
      .withIndex('by_event_person', q =>
        q.eq('eventId', eventId).eq('personId', personId)
      )
      .first();
    if (!previous) fail('Event is not available');
  }
  const visibleSettings =
    access.canRead || canReview
      ? settings
      : { ...settings, questions: pending?.questions ?? [] };
  return {
    settings: visibleSettings,
    canApply: access.canApply,
    canReview,
    pending,
  };
}
export async function history(
  ctx: QueryCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  paginationOpts: PaginationOptions
) {
  await requireActivePerson(ctx, personId);
  if (
    !Number.isInteger(paginationOpts.numItems) ||
    paginationOpts.numItems < 1 ||
    paginationOpts.numItems > 100
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Page size must be 1–100',
    });
  return ctx.db
    .query('eventApplications')
    .withIndex('by_event_person', q =>
      q.eq('eventId', eventId).eq('personId', personId)
    )
    .order('desc')
    .paginate(paginationOpts);
}
export async function list(
  ctx: QueryCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  paginationOpts: PaginationOptions
) {
  if (
    !Number.isInteger(paginationOpts.numItems) ||
    paginationOpts.numItems < 1 ||
    paginationOpts.numItems > 100
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Page size must be 1–100',
    });
  if (!(await context(ctx, eventId, personId)).canReview)
    fail('Application review is not permitted');
  const result = await ctx.db
    .query('eventApplications')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .order('desc')
    .paginate(paginationOpts);
  const page = await Promise.all(
    result.page.map(async application => {
      const author = await getPersonWithUser(ctx, application.personId);
      return {
        ...application,
        applicant: {
          personId: application.personId,
          name: author?.user.name ?? null,
          username: author?.user.username ?? null,
          image: author?.user.image ?? null,
        },
      };
    })
  );
  return { ...result, page };
}

export async function configure(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  settings: NonNullable<Doc<'events'>['applicationSettings']>
) {
  await requireActivePerson(ctx, personId);
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
  try {
    validateQuestions(settings.questions);
  } catch (error) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Invalid questions',
    });
  }
  await ctx.db.patch(eventId, {
    applicationSettings: settings,
    updatedAt: Date.now(),
  });
  return settings;
}
export async function submit(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  answers: Doc<'eventApplications'>['answers']
) {
  const { settings, access } = await context(ctx, eventId, personId);
  if (!access.canApply) fail('You are not currently eligible to apply');
  const pending = await ctx.db
    .query('eventApplications')
    .withIndex('by_event_person_status', q =>
      q.eq('eventId', eventId).eq('personId', personId).eq('status', 'PENDING')
    )
    .first();
  try {
    validateAnswers(pending?.questions ?? settings.questions, answers);
  } catch (error) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Invalid answers',
    });
  }
  const now = Date.now();
  if (pending) {
    await ctx.db.patch(pending._id, { answers, updatedAt: now });
    return { applicationId: pending._id, status: 'PENDING' as const };
  }
  const applicationId = await ctx.db.insert('eventApplications', {
    eventId,
    personId,
    questions: settings.questions,
    answers,
    status: 'PENDING',
    submittedAt: now,
    updatedAt: now,
    decisions: [],
  });
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();
  for (const member of memberships)
    if (
      member.role === 'ORGANIZER' ||
      (settings.reviewerPolicy === 'ORGANIZERS_AND_MODERATORS' &&
        member.role === 'MODERATOR')
    ) {
      try {
        await requireActivePerson(ctx, member.personId);
      } catch (error) {
        if (
          error instanceof ConvexError &&
          typeof error.data === 'object' &&
          error.data !== null &&
          'code' in error.data &&
          error.data.code === 'UNAUTHORIZED'
        )
          continue;
        throw error;
      }
      await notifyPerson(ctx, {
        eventId,
        personId: member.personId,
        authorId: personId,
        type: 'EVENT_APPLICATION_RECEIVED',
      });
    }
  return { applicationId, status: 'PENDING' as const };
}
export async function withdraw(
  ctx: MutationCtx,
  applicationId: Id<'eventApplications'>,
  personId: Id<'persons'>
) {
  await requireActivePerson(ctx, personId);
  const application = await ctx.db.get(applicationId);
  if (!application || application.personId !== personId)
    fail('Application not available');
  if (application.status === 'WITHDRAWN')
    return { applicationId, status: application.status };
  if (application.status !== 'PENDING')
    fail('Only pending applications can be withdrawn');
  const now = Date.now();
  await ctx.db.patch(applicationId, {
    status: 'WITHDRAWN',
    updatedAt: now,
    decisions: [
      ...application.decisions,
      { status: 'WITHDRAWN', actorId: personId, at: now },
    ],
  });
  await ctx.db.insert('eventApplicationActors', { applicationId, personId });
  return { applicationId, status: 'WITHDRAWN' as const };
}
export async function decide(
  ctx: MutationCtx,
  applicationId: Id<'eventApplications'>,
  personId: Id<'persons'>,
  decision: 'APPROVED' | 'DECLINED',
  reason?: string
) {
  const application = await ctx.db.get(applicationId);
  if (!application) fail('Application not available');
  const { canReview, event } = await context(
    ctx,
    application.eventId,
    personId
  );
  if (!canReview) fail('Application review is not permitted');
  if (application.status === decision)
    return { applicationId, status: decision };
  if (application.status !== 'PENDING')
    fail('Application is no longer pending');
  if (reason && reason.length > 2000) fail('Decision reason is too long');
  if (decision === 'APPROVED') {
    await requireActivePerson(ctx, application.personId);
    const ban = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', application.personId).eq('eventId', event._id)
      )
      .first();
    if (
      !(await hasEventAudience(ctx, event, application.personId)) ||
      ban ||
      (await checkIsBlocked(ctx, application.personId, event.creatorId))
    )
      fail('Applicant is no longer eligible');
    await admitAttendeeForPerson(ctx, application.personId, event._id);
  }
  const now = Date.now();
  await ctx.db.patch(applicationId, {
    status: decision,
    updatedAt: now,
    decisions: [
      ...application.decisions,
      {
        status: decision,
        actorId: personId,
        at: now,
        ...(reason ? { reason } : {}),
      },
    ],
  });
  await ctx.db.insert('eventApplicationActors', { applicationId, personId });
  await notifyPerson(ctx, {
    eventId: event._id,
    personId: application.personId,
    authorId: personId,
    type:
      decision === 'APPROVED'
        ? 'EVENT_APPLICATION_APPROVED'
        : 'EVENT_APPLICATION_DECLINED',
  });
  return { applicationId, status: decision };
}

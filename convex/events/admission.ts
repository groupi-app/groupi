import { hasGroupAudience } from '../groupEventAudiences/access';
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { getPersonWithUser } from '../auth';
import { checkIfFriends, checkIsBlocked } from '../lib/privacy';
import { requireWriteRole } from './writes';

type ReadCtx = QueryCtx | MutationCtx;

/** Missing policy preserves the historical visibility-based entry behavior. */
export function resolveAdmissionPolicy(event: Doc<'events'>) {
  return (
    event.admissionPolicy ??
    (event.visibility === 'FRIENDS' ? 'DIRECT' : 'INVITATION_ONLY')
  );
}

export async function hasEventAudience(
  ctx: ReadCtx,
  event: Doc<'events'>,
  personId?: Id<'persons'>
) {
  if (event.visibility === 'PUBLIC') return true;
  return Boolean(
    personId &&
      (event.friendsAudienceEnabled ?? event.visibility === 'FRIENDS') &&
      (await checkIfFriends(ctx, personId, event.creatorId)) &&
      !(await checkIsBlocked(ctx, personId, event.creatorId))
  );
}

export async function eventAdmissionAccess(
  ctx: ReadCtx,
  event: Doc<'events'>,
  personId?: Id<'persons'>
) {
  const membership = personId
    ? await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', personId).eq('eventId', event._id)
        )
        .first()
    : null;
  const ban = personId
    ? await ctx.db
        .query('eventBans')
        .withIndex('by_person_event', q =>
          q.eq('personId', personId).eq('eventId', event._id)
        )
        .first()
    : null;
  const blocked = personId
    ? await checkIsBlocked(ctx, personId, event.creatorId)
    : false;
  const audience = await hasEventAudience(ctx, event, personId);
  const groupAudience = await hasGroupAudience(ctx, event, personId);
  return {
    membership,
    canRead: Boolean(
      membership ||
        ((audience || (groupAudience && !blocked)) &&
          (event.visibility === 'PUBLIC' || !ban))
    ),
    canApply: Boolean(
      personId &&
        !membership &&
        audience &&
        !ban &&
        !blocked &&
        resolveAdmissionPolicy(event) === 'APPLY'
    ),
    canJoin: Boolean(
      personId &&
        !membership &&
        audience &&
        !ban &&
        !blocked &&
        resolveAdmissionPolicy(event) === 'DIRECT'
    ),
  };
}

export async function eventLogisticsForPerson(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  personId?: Id<'persons'>
) {
  const event = await ctx.db.get(eventId);
  if (!event)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found' });
  const access = await eventAdmissionAccess(ctx, event, personId);
  if (!access.canRead)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Access denied to this event',
    });
  const [organizer, dates, imageUrl] = await Promise.all([
    getPersonWithUser(ctx, event.creatorId),
    ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect(),
    event.imageStorageId ? ctx.storage.getUrl(event.imageStorageId) : null,
  ]);
  const policy = resolveAdmissionPolicy(event);
  const entryAction = access.membership
    ? ('MEMBER' as const)
    : policy === ('INVITATION_ONLY' as const)
      ? ('INVITATION_ONLY' as const)
      : !personId
        ? ('SIGN_IN' as const)
        : access.canApply
          ? ('APPLY' as const)
          : access.canJoin
            ? ('JOIN' as const)
            : ('UNAVAILABLE' as const);
  return {
    event: {
      _id: event._id,
      _creationTime: event._creationTime,
      title: event.title,
      description: event.description ?? null,
      location: event.location ?? null,
      creatorId: event.creatorId,
      timezone: event.timezone,
      visibility: event.visibility ?? 'PRIVATE',
      admissionPolicy: policy,
      chosenDateTime: event.chosenDateTime ?? null,
      chosenEndDateTime: event.chosenEndDateTime ?? null,
      imageUrl,
      ...(event.imageFocalPoint
        ? { imageFocalPoint: event.imageFocalPoint }
        : {}),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      potentialDateTimeOptions: dates.map(date => ({
        id: date._id,
        start: date.dateTime,
        end: date.endDateTime ?? null,
        note: date.note ?? null,
      })),
    },
    organizer: organizer
      ? {
          personId: event.creatorId,
          name: organizer.user.name ?? null,
          username: organizer.user.username ?? null,
          image: organizer.user.image ?? null,
        }
      : null,
    entryAction,
  };
}

export async function updateAdmissionPolicyForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY'
) {
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
  await ctx.db.patch(eventId, { admissionPolicy, updatedAt: Date.now() });
  return { eventId, admissionPolicy };
}

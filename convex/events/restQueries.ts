import {
  requireNoEventExclusion,
  isEventExcludedForPerson,
} from '../groups/exclusions';
import type { QueryCtx } from '../_generated/server';
import { reminderOffsetValidator } from './writes';
import { internalQuery } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { getPersonWithUser } from '../auth';

/**
 * Internal queries and mutations for event routes
 */

export const eventSummaryValidator = v.object({
  id: v.id('events'),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  location: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  chosenDateTime: v.union(v.number(), v.null()),
  chosenEndDateTime: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
  memberCount: v.number(),
  userRole: v.union(
    v.literal('ORGANIZER'),
    v.literal('MODERATOR'),
    v.literal('ATTENDEE')
  ),
  userRsvpStatus: v.union(
    v.literal('YES'),
    v.literal('MAYBE'),
    v.literal('NO'),
    v.literal('PENDING')
  ),
});

export const listUserEvents = internalQuery({
  args: {
    personId: v.id('persons'),
  },
  returns: v.object({ events: v.array(eventSummaryValidator) }),
  handler: async (ctx, { personId }) => {
    // Get all memberships for this person
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', personId))
      .collect();

    // Get event data for each membership
    const events = await Promise.all(
      memberships.map(async membership => {
        const event = await ctx.db.get(membership.eventId);
        if (!event) return null;

        const memberCount = event.memberCount ?? 0;

        // Get image URL
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          id: event._id,
          title: event.title,
          description: event.description ?? null,
          location: event.location ?? null,
          imageUrl,
          chosenDateTime: event.chosenDateTime ?? null,
          chosenEndDateTime: event.chosenEndDateTime ?? null,
          createdAt: event._creationTime,
          updatedAt: event.updatedAt,
          memberCount,
          userRole: membership.role,
          userRsvpStatus: membership.rsvpStatus,
        };
      })
    );

    return {
      events: events.filter(e => e !== null),
    };
  },
});

/** Cursor mode scans at most one bounded membership page, including stale memberships. */
export const listUserEventsPage = internalQuery({
  args: {
    personId: v.id('persons'),
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.union(
    v.object({
      items: v.array(eventSummaryValidator),
      nextCursor: v.union(v.string(), v.null()),
    }),
    v.object({ error: v.literal('INVALID_CURSOR') })
  ),
  handler: async (ctx, { personId, limit, cursor }) => {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error('Invalid page size');
    let nativeCursor: string | null = null;
    if (cursor !== null) {
      try {
        const parsed: unknown = JSON.parse(atob(cursor));
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('personId' in parsed) ||
          parsed.personId !== personId ||
          !('cursor' in parsed) ||
          typeof parsed.cursor !== 'string'
        )
          return { error: 'INVALID_CURSOR' as const };
        nativeCursor = parsed.cursor;
      } catch {
        return { error: 'INVALID_CURSOR' as const };
      }
    }
    const query = ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', personId));
    let page;
    try {
      page = await query.paginate({ cursor: nativeCursor, numItems: limit });
    } catch (error) {
      if (nativeCursor !== null) return { error: 'INVALID_CURSOR' as const };
      throw error;
    }
    const items = await Promise.all(
      page.page.map(async membership => {
        if (await isEventExcludedForPerson(ctx, membership.eventId, personId))
          return null;
        const event = await ctx.db.get(membership.eventId);
        if (!event) return null;
        return {
          id: event._id,
          title: event.title,
          description: event.description ?? null,
          location: event.location ?? null,
          imageUrl: event.imageStorageId
            ? await ctx.storage.getUrl(event.imageStorageId)
            : null,
          chosenDateTime: event.chosenDateTime ?? null,
          chosenEndDateTime: event.chosenEndDateTime ?? null,
          createdAt: event._creationTime,
          updatedAt: event.updatedAt,
          memberCount: event.memberCount ?? 0,
          userRole: membership.role,
          userRsvpStatus: membership.rsvpStatus,
        };
      })
    );
    return {
      items: items.filter(item => item !== null),
      nextCursor: page.isDone
        ? null
        : btoa(JSON.stringify({ personId, cursor: page.continueCursor })),
    };
  },
});

export const eventDetailValidator = v.object({
  id: v.id('events'),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  location: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  timezone: v.string(),
  chosenDateTime: v.union(v.number(), v.null()),
  chosenEndDateTime: v.union(v.number(), v.null()),
  reminderOffset: v.union(reminderOffsetValidator, v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
  creator: v.union(
    v.null(),
    v.object({
      id: v.id('persons'),
      user: v.object({
        id: v.string(),
        name: v.union(v.string(), v.null()),
        email: v.union(v.string(), v.null()),
        image: v.union(v.string(), v.null()),
        username: v.union(v.string(), v.null()),
      }),
    })
  ),
  potentialDateTimeOptions: v.array(
    v.object({
      id: v.id('potentialDateTimes'),
      start: v.number(),
      end: v.union(v.number(), v.null()),
      note: v.union(v.string(), v.null()),
    })
  ),
});
export async function readEventDetail(ctx: QueryCtx, eventId: Id<'events'>) {
  const event = await ctx.db.get(eventId);
  if (!event) return null;

  // Get creator data
  const creatorData = await getPersonWithUser(ctx, event.creatorId);

  // Get image URL
  const imageUrl = event.imageStorageId
    ? await ctx.storage.getUrl(event.imageStorageId)
    : null;

  const options = await ctx.db
    .query('potentialDateTimes')
    .withIndex('by_event', q => q.eq('eventId', event._id))
    .collect();
  return {
    potentialDateTimeOptions: options.map(opt => ({
      id: opt._id,
      start: opt.dateTime,
      end: opt.endDateTime ?? null,
      note: opt.note ?? null,
    })),
    id: event._id,
    title: event.title,
    description: event.description ?? null,
    location: event.location ?? null,
    imageUrl,
    timezone: event.timezone,
    chosenDateTime: event.chosenDateTime ?? null,
    chosenEndDateTime: event.chosenEndDateTime ?? null,
    reminderOffset: event.reminderOffset ?? null,
    createdAt: event._creationTime,
    updatedAt: event.updatedAt,
    creator: creatorData
      ? {
          id: creatorData.person._id,
          user: {
            id: creatorData.user._id,
            name: creatorData.user.name ?? null,
            email: creatorData.user.email ?? null,
            image: creatorData.user.image ?? null,
            username: creatorData.user.username ?? null,
          },
        }
      : null,
  };
}
export const getEventDetail = internalQuery({
  args: { eventId: v.id('events'), personId: v.id('persons') },
  returns: v.union(eventDetailValidator, v.null()),
  handler: async (ctx, { eventId, personId }) => {
    await requireNoEventExclusion(ctx, eventId, personId);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', eventId)
      )
      .first();
    if (!membership)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Event membership required',
      });
    return readEventDetail(ctx, eventId);
  },
});

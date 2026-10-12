import { removeAudiencesForEvent } from '../groupEventAudiences/cleanup';
import { deleteEventTransfers } from '../eventTransfers/cleanup';
import { deleteEventApplications } from '../eventApplications/cleanup';
import { authComponent, type AuthUserId, type ExtendedAuthUser } from '../auth';
import { isAdminRole } from '../lib/constants';
import { hash } from '../lib/requestId';
import {
  enableAddonConfiguration,
  disableAddonConfiguration,
} from '../addons/mutations';
import { REMINDER_OFFSETS } from '../types';
import { reminderOffsetValidator, requireWriteRole } from './writes';
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import {
  createEventArgs,
  createEventForPerson,
  updateEventForPerson,
  updatePotentialDateTimesForPerson,
} from './writes';
import { readEventDetail, eventDetailValidator } from './restQueries';
import { parseGDL } from '@groupi/shared/gdl';

function requestValidationError(message: string) {
  return new ConvexError({ code: 'VALIDATION_ERROR', message });
}
const option = v.object({
  start: v.string(),
  end: v.optional(v.string()),
  note: v.optional(v.string()),
});
const createBody = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  chosenDateTime: v.optional(v.string()),
  chosenEndDateTime: v.optional(v.string()),
  potentialDateTimeOptions: v.optional(v.array(option)),
  gdl: v.optional(v.string()),
  timezone: v.optional(v.string()),
  reminderOffset: createEventArgs.fields.reminderOffset,
});
const ids = v.object({
  eventId: v.id('events'),
  membershipId: v.id('memberships'),
});
const DAY = 24 * 60 * 60 * 1000;
export const create = internalMutation({
  args: {
    personId: v.id('persons'),
    userId: v.string(),
    requestId: v.optional(v.string()),
    body: createBody,
  },
  returns: ids,
  handler: async (ctx, { personId, userId, requestId, body }) => {
    const now = Date.now();
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Account identity does not match.',
      });
    let expiresAt: number | undefined;
    let payloadHash: string | undefined;
    if (requestId !== undefined) {
      if (
        !/^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
          requestId
        )
      )
        throw requestValidationError(
          'Idempotency-Key must be <unix-ms>.<uuid-v4>.'
        );
      const issuedAt = Number(requestId.split('.')[0]);
      if (issuedAt > now + 300000)
        throw requestValidationError(
          'Idempotency-Key timestamp is too far in the future.'
        );
      expiresAt = issuedAt + DAY;
      if (expiresAt <= now)
        throw new ConvexError({
          code: 'IDEMPOTENCY_EXPIRED',
          message:
            'Request identifier expired after 24 hours. Inspect your events before creating with a new identifier.',
        });
      payloadHash = await hash(body);
      const previous = await ctx.db
        .query('eventCreationRequests')
        .withIndex('by_userId_and_operation_and_requestId', q =>
          q
            .eq('userId', userId)
            .eq('operation', 'events.create')
            .eq('requestId', requestId)
        )
        .unique();
      if (previous) {
        if (previous.payloadHash !== payloadHash)
          throw new ConvexError({
            code: 'IDEMPOTENCY_CONFLICT',
            message:
              'Request identifier was already used with a different event payload.',
          });
        return {
          eventId: previous.eventId,
          membershipId: previous.membershipId,
        };
      }
    }
    // Expand relative GDL only after checking replay; the hash binds the original
    // accepted input, not dates that would change when parsing on another day.
    const { gdl, timezone, ...args } = body;
    if (gdl !== undefined) {
      if (args.potentialDateTimeOptions !== undefined)
        throw requestValidationError(
          'Cannot combine gdl and potentialDateTimeOptions.'
        );
      const parsed = parseGDL(gdl, {
        referenceDate: new Date(now),
        timeZone: timezone ?? 'UTC',
      });
      if (!parsed.success)
        throw requestValidationError(`Invalid GDL expression: ${parsed.error}`);
      args.potentialDateTimeOptions = parsed.results.map(value => ({
        start: value.start.toISOString(),
        ...(value.end ? { end: value.end.toISOString() } : {}),
      }));
    }
    const { eventId, membershipId } = await createEventForPerson(
      ctx,
      personId,
      args
    );
    if (
      requestId !== undefined &&
      expiresAt !== undefined &&
      payloadHash !== undefined
    ) {
      const requestRowId = await ctx.db.insert('eventCreationRequests', {
        userId,
        operation: 'events.create',
        requestId,
        payloadHash,
        expiresAt,
        eventId,
        membershipId,
      });
      await ctx.scheduler.runAfter(
        Math.max(0, expiresAt - now),
        internal.events.rest.expireRequest,
        { requestRowId }
      );
    }
    return { eventId, membershipId };
  },
});
export const expireRequest = internalMutation({
  args: { requestRowId: v.id('eventCreationRequests') },
  returns: v.null(),
  handler: async (ctx, { requestRowId }) => {
    const row = await ctx.db.get(requestRowId);
    if (row && row.expiresAt <= Date.now()) await ctx.db.delete(requestRowId);
    return null;
  },
});
export const update = internalMutation({
  args: {
    personId: v.id('persons'),
    eventId: v.id('events'),
    body: v.object({
      reminderOffset: v.optional(v.union(reminderOffsetValidator, v.null())),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      potentialDateTimeOptions: v.optional(v.array(option)),
    }),
  },
  returns: eventDetailValidator,
  handler: async (ctx, { personId, eventId, body }) => {
    if (!Object.values(body).some(value => value !== undefined))
      throw requestValidationError(
        'Specify at least one event field to update.'
      );
    const { potentialDateTimeOptions, reminderOffset, ...basic } = body;
    // The app explicitly resets its fixed date after replacing poll options.
    // REST must not cancel reminders while leaving a confirmed date in place.
    if (potentialDateTimeOptions !== undefined) {
      await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
      const event = await ctx.db.get(eventId);
      if (event?.chosenDateTime !== undefined)
        throw new ConvexError({
          code: 'DATE_RESET_REQUIRED',
          message:
            'Reset the confirmed event date in the app before replacing proposed dates. CLI date reset is not available yet.',
        });
    }
    if (reminderOffset !== undefined) {
      await requireWriteRole(ctx, eventId, personId, 'MODERATOR');
      const event = await ctx.db.get(eventId);
      if (!event) throw requestValidationError('Event not found');
      if (
        reminderOffset !== null &&
        event.chosenDateTime !== undefined &&
        event.chosenDateTime - REMINDER_OFFSETS[reminderOffset] <= Date.now()
      )
        throw requestValidationError(
          'Reminder time would be in the past. Choose a shorter reminder offset.'
        );
      if (reminderOffset === null)
        await disableAddonConfiguration(ctx, eventId, 'reminders');
      else
        await enableAddonConfiguration(ctx, eventId, 'reminders', {
          reminderOffset,
        });
      await ctx.db.patch(eventId, {
        reminderOffset: reminderOffset ?? undefined,
        updatedAt: Date.now(),
      });
    }
    if (Object.values(basic).some(value => value !== undefined))
      await updateEventForPerson(ctx, personId, { eventId, ...basic });
    if (potentialDateTimeOptions !== undefined)
      await updatePotentialDateTimesForPerson(ctx, personId, {
        eventId,
        potentialDateTimeOptions: potentialDateTimeOptions.map(opt => ({
          start: parseEventDate(opt.start),
          ...(opt.end === undefined ? {} : { end: parseEventDate(opt.end) }),
          ...(opt.note === undefined ? {} : { note: opt.note }),
        })),
      });
    const event = await readEventDetail(ctx, eventId);
    if (!event) throw requestValidationError('Event not found');
    return event;
  },
});
import { parseEventDate } from './writes';

/** Administrative deletion: caller identity is verified by REST authentication. */
export const deleteEvent = internalMutation({
  args: {
    eventId: v.id('events'),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { eventId, userId }) => {
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!isAdminRole((user as ExtendedAuthUser | null)?.role)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Admin privileges required',
      });
    }
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Delete image if exists
    if (event.imageStorageId) {
      try {
        await ctx.storage.delete(event.imageStorageId);
      } catch {
        // Ignore
      }
    }

    await deleteEventTransfers(ctx, eventId);
    await removeAudiencesForEvent(ctx, eventId);

    // Delete all related data
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    // Delete availabilities
    for (const membership of memberships) {
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();
      for (const avail of availabilities) {
        await ctx.db.delete(avail._id);
      }
    }

    // Delete potential date times
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    for (const pdt of potentialDates) {
      await ctx.db.delete(pdt._id);
    }

    // Delete posts and replies
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    for (const post of posts) {
      const replies = await ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect();
      for (const reply of replies) {
        await ctx.db.delete(reply._id);
      }
      await ctx.db.delete(post._id);
    }

    // Delete invites
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete notifications
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
    }

    // Delete memberships
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete event
    await deleteEventApplications(ctx, eventId);
    await ctx.db.delete(eventId);

    return { success: true };
  },
});

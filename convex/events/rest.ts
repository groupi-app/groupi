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
import {
  readEventDetail,
  eventDetailValidator,
} from '../api/v1/internal/events';
import { parseGDL } from '../lib/gdl_parser';

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
  reminderOffset: createEventArgs.fields.reminderOffset,
});
const ids = v.object({
  eventId: v.id('events'),
  membershipId: v.id('memberships'),
});
const DAY = 24 * 60 * 60 * 1000;
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)])
    );
  return value;
}
async function hash(value: unknown) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(canonical(value)))
    )
  );
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export const create = internalMutation({
  args: {
    personId: v.id('persons'),
    userId: v.string(),
    requestId: v.optional(v.string()),
    body: createBody,
  },
  returns: ids,
  handler: async (ctx, { personId, userId, requestId, body }) => {
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
      if (issuedAt > Date.now() + 300000)
        throw requestValidationError(
          'Idempotency-Key timestamp is too far in the future.'
        );
      expiresAt = issuedAt + DAY;
      if (expiresAt <= Date.now())
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
    const { gdl, ...args } = body;
    if (gdl !== undefined) {
      if (args.potentialDateTimeOptions !== undefined)
        throw requestValidationError(
          'Cannot combine gdl and potentialDateTimeOptions.'
        );
      const parsed = parseGDL(gdl);
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
        Math.max(0, expiresAt - Date.now()),
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

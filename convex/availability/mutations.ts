import * as writes from './writes';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';

/**
 * Availability mutations for the Convex backend
 *
 * These functions handle availability responses and date management
 * with proper authentication and authorization checks.
 */

/**
 * Submit availability for multiple potential date times
 */
export const submitAvailability = mutation({
  args: writes.submitAvailabilityArgs,
  returns: v.object({
    responses: v.array(
      v.object({
        potentialDateTimeId: v.id('potentialDateTimes'),
        status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
        action: v.union(v.literal('created'), v.literal('updated')),
      })
    ),
    membershipId: v.id('memberships'),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.submitAvailabilityForPerson(ctx, person._id, args);
  },
});

/**
 * Update availability for a single potential date time
 */
export const updateSingleAvailability = mutation({
  args: writes.updateSingleAvailabilityArgs,
  returns: v.object({
    availabilityId: v.id('availabilities'),
    status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
    action: v.union(v.literal('created'), v.literal('updated')),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.updateSingleAvailabilityForPerson(ctx, person._id, args);
  },
});

/**
 * Clear user's availability for all dates in an event
 */
export const clearAllAvailability = mutation({
  args: writes.clearAllAvailabilityArgs,
  returns: v.object({
    deletedCount: v.number(),
    membershipId: v.id('memberships'),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.clearAllAvailabilityForPerson(ctx, person._id, args);
  },
});

/**
 * Add potential date times to an event (organizer only)
 */
export const addPotentialDateTimes = mutation({
  args: {
    eventId: v.id('events'),
    dateTimes: v.array(
      v.union(
        v.number(), // Legacy: plain timestamp
        v.object({
          dateTime: v.number(),
          note: v.optional(v.string()),
        })
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, dateTimes }) => {
    // Require organizer role
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    // Create new potential date times
    const now = Date.now();
    const potentialDateTimeIds = await Promise.all(
      dateTimes.map(async item => {
        const timestamp = typeof item === 'number' ? item : item.dateTime;
        const note = typeof item === 'number' ? undefined : item.note;
        if (note && note.length > 200) {
          throw new Error('Note must be 200 characters or less');
        }
        return await ctx.db.insert('potentialDateTimes', {
          eventId: eventId,
          dateTime: timestamp,
          note,
          updatedAt: now,
        });
      })
    );

    // Get the created potential date times
    const potentialDateTimes = await Promise.all(
      potentialDateTimeIds.map(id => ctx.db.get(id))
    );

    return {
      potentialDateTimes: potentialDateTimes
        .filter(d => d !== null)
        .map(d => ({
          id: d!._id,
          eventId: d!.eventId,
          dateTime: d!.dateTime,
        })),
    };
  },
});

/**
 * Remove potential date times from an event (organizer only)
 */
export const removePotentialDateTimes = mutation({
  args: {
    potentialDateTimeIds: v.array(v.id('potentialDateTimes')),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { potentialDateTimeIds }) => {
    // Get all potential date times to verify permissions
    const potentialDateTimes = await Promise.all(
      potentialDateTimeIds.map(id => ctx.db.get(id))
    );

    const validDates = potentialDateTimes.filter(d => d !== null);

    if (validDates.length === 0) {
      throw new Error('No valid potential date times found');
    }

    // Check permissions for all events
    const eventIds = [...new Set(validDates.map(d => d!.eventId))];
    for (const eventId of eventIds) {
      await requireEventRole(ctx, eventId, 'ORGANIZER');
    }

    // Delete all availabilities for these potential date times
    for (const dateTime of validDates) {
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_potential_date', q =>
          q.eq('potentialDateTimeId', dateTime!._id)
        )
        .collect();

      for (const availability of availabilities) {
        await ctx.db.delete(availability._id);
      }

      // Delete the potential date time
      await ctx.db.delete(dateTime!._id);
    }

    return {
      deletedCount: validDates.length,
      deletedIds: validDates.map(d => d!._id),
    };
  },
});

/**
 * Update the note on a potential date time (organizer only)
 */
export const updatePotentialDateTimeNote = mutation({
  args: {
    potentialDateTimeId: v.id('potentialDateTimes'),
    note: v.optional(v.string()), // Pass undefined/empty to clear
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { potentialDateTimeId, note }) => {
    const potentialDateTime = await ctx.db.get(potentialDateTimeId);
    if (!potentialDateTime) {
      throw new Error('Potential date time not found');
    }

    // Require organizer role
    await requireEventRole(ctx, potentialDateTime.eventId, 'ORGANIZER');

    // Validate note length
    if (note && note.length > 200) {
      throw new Error('Note must be 200 characters or less');
    }

    await ctx.db.patch(potentialDateTimeId, {
      note: note || undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

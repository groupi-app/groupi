import { mutation, type MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';
import type { Doc, Id } from '../_generated/dataModel';

/**
 * Availability mutations for the Convex backend
 *
 * These functions handle availability responses and date management
 * with proper authentication and authorization checks.
 */

function compareAvailabilityRecency(
  left: Doc<'availabilities'>,
  right: Doc<'availabilities'>
): number {
  const timestampDifference =
    (left.updatedAt ?? left._creationTime) -
    (right.updatedAt ?? right._creationTime);

  if (timestampDifference !== 0) return timestampDifference;

  const creationTimeDifference = left._creationTime - right._creationTime;
  if (creationTimeDifference !== 0) return creationTimeDifference;

  return String(left._id).localeCompare(String(right._id));
}

async function consolidateAvailabilityResponses(
  ctx: MutationCtx,
  membershipId: Id<'memberships'>,
  potentialDateTimeId: Id<'potentialDateTimes'>
): Promise<Doc<'availabilities'> | null> {
  const existingAvailabilities = await ctx.db
    .query('availabilities')
    .withIndex('by_membership_date', q =>
      q
        .eq('membershipId', membershipId)
        .eq('potentialDateTimeId', potentialDateTimeId)
    )
    .collect();

  if (existingAvailabilities.length === 0) return null;

  const mostRecentAvailability = existingAvailabilities.reduce(
    (mostRecent, availability) =>
      compareAvailabilityRecency(availability, mostRecent) > 0
        ? availability
        : mostRecent
  );

  await Promise.all(
    existingAvailabilities
      .filter(availability => availability._id !== mostRecentAvailability._id)
      .map(availability => ctx.db.delete(availability._id))
  );

  return mostRecentAvailability;
}

function assertUniquePotentialDateTimeIds(
  responses: Array<{ potentialDateTimeId: Id<'potentialDateTimes'> }>
) {
  const uniqueIds = new Set(
    responses.map(response => response.potentialDateTimeId)
  );
  if (uniqueIds.size !== responses.length) {
    throw new Error(
      'Each potential date time can only appear once per availability submission'
    );
  }
}

/**
 * Submit availability for multiple potential date times
 */
export const submitAvailability = mutation({
  args: {
    eventId: v.id('events'),
    responses: v.array(
      v.object({
        potentialDateTimeId: v.id('potentialDateTimes'),
        status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
        note: v.optional(v.string()),
      })
    ),
    _traceId: v.optional(v.string()),
  },
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
  handler: async (ctx, { eventId, responses }) => {
    // Require authentication and membership
    const { person } = await requireAuth(ctx);

    assertUniquePotentialDateTimeIds(responses);

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    const now = Date.now();
    const results: Array<{
      potentialDateTimeId: Id<'potentialDateTimes'>;
      status: 'YES' | 'NO' | 'MAYBE';
      action: 'created' | 'updated';
    }> = [];

    // Process sequentially so each response observes earlier writes in this
    // transaction and a membership/date pair can never be inserted twice.
    for (const { potentialDateTimeId, status, note } of responses) {
      if (note && note.length > 200) {
        throw new Error('Note must be 200 characters or less');
      }

      const potentialDateTime = await ctx.db.get(potentialDateTimeId);
      if (!potentialDateTime || potentialDateTime.eventId !== eventId) {
        throw new Error('Potential date time does not belong to this event');
      }

      const existingAvailability = await consolidateAvailabilityResponses(
        ctx,
        membership._id,
        potentialDateTimeId
      );

      if (existingAvailability) {
        await ctx.db.patch(existingAvailability._id, {
          status,
          note: note || undefined,
          updatedAt: now,
        });
        results.push({
          potentialDateTimeId,
          status,
          action: 'updated',
        });
      } else {
        await ctx.db.insert('availabilities', {
          membershipId: membership._id,
          potentialDateTimeId,
          status,
          note: note || undefined,
          updatedAt: now,
        });
        results.push({
          potentialDateTimeId,
          status,
          action: 'created',
        });
      }
    }

    return {
      responses: results,
      membershipId: membership._id,
    };
  },
});

/**
 * Update availability for a single potential date time
 */
export const updateSingleAvailability = mutation({
  args: {
    potentialDateTimeId: v.id('potentialDateTimes'),
    status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
    note: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({
    availabilityId: v.id('availabilities'),
    status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
    action: v.union(v.literal('created'), v.literal('updated')),
  }),
  handler: async (ctx, { potentialDateTimeId, status, note }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get the potential date time to find the event
    const potentialDateTime = await ctx.db.get(potentialDateTimeId);
    if (!potentialDateTime) {
      throw new Error('Potential date time not found');
    }

    // Get user's membership for this event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', potentialDateTime.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Validate note length
    if (note && note.length > 200) {
      throw new Error('Note must be 200 characters or less');
    }

    // Collapse any historical duplicates before applying the update.
    const existingAvailability = await consolidateAvailabilityResponses(
      ctx,
      membership._id,
      potentialDateTimeId
    );

    if (existingAvailability) {
      // Update existing availability
      await ctx.db.patch(existingAvailability._id, {
        status: status,
        note: note || undefined,
        updatedAt: Date.now(),
      });
      return {
        availabilityId: existingAvailability._id,
        status,
        action: 'updated' as const,
      };
    } else {
      // Create new availability
      const availabilityId = await ctx.db.insert('availabilities', {
        membershipId: membership._id,
        potentialDateTimeId: potentialDateTimeId,
        status: status,
        note: note || undefined,
        updatedAt: Date.now(),
      });
      return {
        availabilityId,
        status,
        action: 'created' as const,
      };
    }
  },
});

/**
 * Clear user's availability for all dates in an event
 */
export const clearAllAvailability = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require authentication and membership
    const { person } = await requireAuth(ctx);

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Get all availabilities for this member
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q => q.eq('membershipId', membership._id))
      .collect();

    // Delete all availabilities
    await Promise.all(
      availabilities.map(availability => ctx.db.delete(availability._id))
    );

    return {
      deletedCount: availabilities.length,
      membershipId: membership._id,
    };
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

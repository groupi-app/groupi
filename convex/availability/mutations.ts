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
  args: {
    eventId: v.id('events'),
    responses: v.array(
      v.object({
        potentialDateTimeId: v.id('potentialDateTimes'),
        status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
      })
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, responses }) => {
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

    // Process each availability response
    const results = await Promise.all(
      responses.map(async ({ potentialDateTimeId, status }) => {
        // Check if availability already exists for this member and date
        const existingAvailability = await ctx.db
          .query('availabilities')
          .withIndex('by_membership_date', q =>
            q
              .eq('membershipId', membership._id)
              .eq('potentialDateTimeId', potentialDateTimeId)
          )
          .first();

        if (existingAvailability) {
          // Update existing availability
          await ctx.db.patch(existingAvailability._id, {
            status: status,
          });
          return { potentialDateTimeId, status, action: 'updated' as const };
        } else {
          // Create new availability
          await ctx.db.insert('availabilities', {
            membershipId: membership._id,
            potentialDateTimeId: potentialDateTimeId,
            status: status,
          });
          return { potentialDateTimeId, status, action: 'created' as const };
        }
      })
    );

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
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { potentialDateTimeId, status }) => {
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

    // Check if availability already exists
    const existingAvailability = await ctx.db
      .query('availabilities')
      .withIndex('by_membership_date', q =>
        q
          .eq('membershipId', membership._id)
          .eq('potentialDateTimeId', potentialDateTimeId)
      )
      .first();

    if (existingAvailability) {
      // Update existing availability
      await ctx.db.patch(existingAvailability._id, {
        status: status,
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
    dateTimes: v.array(v.number()), // Unix timestamps
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, dateTimes }) => {
    // Require organizer role
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    // Create new potential date times
    const potentialDateTimeIds = await Promise.all(
      dateTimes.map(async timestamp => {
        return await ctx.db.insert('potentialDateTimes', {
          eventId: eventId,
          dateTime: timestamp,
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

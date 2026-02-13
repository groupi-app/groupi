import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * Toggle reminder opt-out for an event
 */
export const toggleReminderOptOut = mutation({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);

    // Check if event exists
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Check current opt-out status
    const existingOptOut = await ctx.db
      .query('reminderOptOuts')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (existingOptOut) {
      // Currently opted out - opt back in
      await ctx.db.delete(existingOptOut._id);
      return { isOptedOut: false };
    } else {
      // Currently opted in - opt out
      const now = Date.now();
      await ctx.db.insert('reminderOptOuts', {
        personId: person._id,
        eventId,
        optedOutAt: now,
        updatedAt: now,
      });
      return { isOptedOut: true };
    }
  },
});

import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * Check if the current user has opted out of reminders for an event
 */
export const isReminderOptedOut = query({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);

    const existingOptOut = await ctx.db
      .query('reminderOptOuts')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    return { isOptedOut: !!existingOptOut };
  },
});

import { internalMutation } from '../../_generated/server';
import { v } from 'convex/values';

/**
 * Create a system post in event discussion.
 * Used by the automation engine's create_post action.
 */
export const createSystemPost = internalMutation({
  args: {
    eventId: v.id('events'),
    authorId: v.id('persons'),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { eventId, authorId, title, content }) => {
    // Look up the membership for the author
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', authorId).eq('eventId', eventId)
      )
      .first();

    const postId = await ctx.db.insert('posts', {
      eventId,
      authorId,
      membershipId: membership?._id,
      title,
      content,
      updatedAt: Date.now(),
    });

    return postId;
  },
});

/**
 * Update an event's description.
 * Used by the automation engine's update_event_description action.
 */
export const updateEventDescription = internalMutation({
  args: {
    eventId: v.id('events'),
    description: v.string(),
  },
  handler: async (ctx, { eventId, description }) => {
    await ctx.db.patch(eventId, {
      description,
      updatedAt: Date.now(),
    });
  },
});

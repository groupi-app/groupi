import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * Muting queries for the Convex backend
 *
 * These functions check mute status for events and posts.
 */

/**
 * Check if the current user has muted an event
 */
export const isEventMuted = query({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);

    const existingMute = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    return { isMuted: !!existingMute };
  },
});

/**
 * Check if the current user has muted a post
 */
export const isPostMuted = query({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);

    const existingMute = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person_post', q =>
        q.eq('personId', person._id).eq('postId', postId)
      )
      .first();

    return { isMuted: !!existingMute };
  },
});

/**
 * Get all muted events for the current user
 */
export const getMutedEvents = query({
  args: {},
  handler: async ctx => {
    const { person } = await requireAuth(ctx);

    const mutedEvents = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    // Get event details for each muted event
    const eventsWithDetails = await Promise.all(
      mutedEvents.map(async mute => {
        const event = await ctx.db.get(mute.eventId);
        return {
          ...mute,
          event,
        };
      })
    );

    return eventsWithDetails.filter(e => e.event !== null);
  },
});

/**
 * Get all muted posts for the current user
 */
export const getMutedPosts = query({
  args: {},
  handler: async ctx => {
    const { person } = await requireAuth(ctx);

    const mutedPosts = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    // Get post details for each muted post
    const postsWithDetails = await Promise.all(
      mutedPosts.map(async mute => {
        const post = await ctx.db.get(mute.postId);
        return {
          ...mute,
          post,
        };
      })
    );

    return postsWithDetails.filter(p => p.post !== null);
  },
});

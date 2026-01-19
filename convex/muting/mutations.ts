import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * Muting mutations for the Convex backend
 *
 * These functions handle muting/unmuting events and posts
 * to suppress notifications for specific content.
 */

/**
 * Mute an event - stops notifications for this event
 */
export const muteEvent = mutation({
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

    // Check if already muted
    const existingMute = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (existingMute) {
      // Already muted, return existing
      return { mutedEventId: existingMute._id, alreadyMuted: true };
    }

    // Create mute record
    const now = Date.now();
    const mutedEventId = await ctx.db.insert('mutedEvents', {
      personId: person._id,
      eventId,
      mutedAt: now,
      updatedAt: now,
    });

    return { mutedEventId, alreadyMuted: false };
  },
});

/**
 * Unmute an event - resume receiving notifications for this event
 */
export const unmuteEvent = mutation({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);

    // Find and delete the mute record
    const existingMute = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!existingMute) {
      return { unmuted: false, wasNotMuted: true };
    }

    await ctx.db.delete(existingMute._id);
    return { unmuted: true, wasNotMuted: false };
  },
});

/**
 * Toggle mute status for an event
 */
export const toggleEventMute = mutation({
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

    // Check current mute status
    const existingMute = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (existingMute) {
      // Currently muted - unmute
      await ctx.db.delete(existingMute._id);
      return { isMuted: false };
    } else {
      // Currently not muted - mute
      const now = Date.now();
      await ctx.db.insert('mutedEvents', {
        personId: person._id,
        eventId,
        mutedAt: now,
        updatedAt: now,
      });
      return { isMuted: true };
    }
  },
});

/**
 * Mute a post - stops notifications for this post (replies, etc.)
 */
export const mutePost = mutation({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);

    // Check if post exists
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Check if already muted
    const existingMute = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person_post', q =>
        q.eq('personId', person._id).eq('postId', postId)
      )
      .first();

    if (existingMute) {
      // Already muted, return existing
      return { mutedPostId: existingMute._id, alreadyMuted: true };
    }

    // Create mute record
    const now = Date.now();
    const mutedPostId = await ctx.db.insert('mutedPosts', {
      personId: person._id,
      postId,
      mutedAt: now,
      updatedAt: now,
    });

    return { mutedPostId, alreadyMuted: false };
  },
});

/**
 * Unmute a post - resume receiving notifications for this post
 */
export const unmutePost = mutation({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);

    // Find and delete the mute record
    const existingMute = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person_post', q =>
        q.eq('personId', person._id).eq('postId', postId)
      )
      .first();

    if (!existingMute) {
      return { unmuted: false, wasNotMuted: true };
    }

    await ctx.db.delete(existingMute._id);
    return { unmuted: true, wasNotMuted: false };
  },
});

/**
 * Toggle mute status for a post
 */
export const togglePostMute = mutation({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);

    // Check if post exists
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Check current mute status
    const existingMute = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person_post', q =>
        q.eq('personId', person._id).eq('postId', postId)
      )
      .first();

    if (existingMute) {
      // Currently muted - unmute
      await ctx.db.delete(existingMute._id);
      return { isMuted: false };
    } else {
      // Currently not muted - mute
      const now = Date.now();
      await ctx.db.insert('mutedPosts', {
        personId: person._id,
        postId,
        mutedAt: now,
        updatedAt: now,
      });
      return { isMuted: true };
    }
  },
});

import {
  muteEventForPerson,
  unmuteEventForPerson,
  toggleEventMuteForPerson,
  mutePostForPerson,
  unmutePostForPerson,
  togglePostMuteForPerson,
} from './model';
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
  returns: v.object({
    mutedEventId: v.id('mutedEvents'),
    alreadyMuted: v.boolean(),
  }),
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);
    return muteEventForPerson(ctx, person._id, eventId);
  },
});

/**
 * Unmute an event - resume receiving notifications for this event
 */
export const unmuteEvent = mutation({
  args: {
    eventId: v.id('events'),
  },
  returns: v.object({ unmuted: v.boolean(), wasNotMuted: v.boolean() }),
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);
    return unmuteEventForPerson(ctx, person._id, eventId);
  },
});

/**
 * Toggle mute status for an event
 */
export const toggleEventMute = mutation({
  args: {
    eventId: v.id('events'),
  },
  returns: v.object({ isMuted: v.boolean() }),
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);
    return toggleEventMuteForPerson(ctx, person._id, eventId);
  },
});

/**
 * Mute a post - stops notifications for this post (replies, etc.)
 */
export const mutePost = mutation({
  args: {
    postId: v.id('posts'),
  },
  returns: v.object({
    mutedPostId: v.id('mutedPosts'),
    alreadyMuted: v.boolean(),
  }),
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);
    return mutePostForPerson(ctx, person._id, postId);
  },
});

/**
 * Unmute a post - resume receiving notifications for this post
 */
export const unmutePost = mutation({
  args: {
    postId: v.id('posts'),
  },
  returns: v.object({ unmuted: v.boolean(), wasNotMuted: v.boolean() }),
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);
    return unmutePostForPerson(ctx, person._id, postId);
  },
});

/**
 * Toggle mute status for a post
 */
export const togglePostMute = mutation({
  args: {
    postId: v.id('posts'),
  },
  returns: v.object({ isMuted: v.boolean() }),
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);
    return togglePostMuteForPerson(ctx, person._id, postId);
  },
});

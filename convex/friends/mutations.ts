import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import {
  sendFriendRequestForPerson,
  acceptFriendRequestForPerson,
  declineFriendRequestForPerson,
  cancelFriendRequestForPerson,
  removeFriendForPerson,
  removeFriendByPersonIdForPerson,
  blockUserForPerson,
  unblockUserForPerson,
} from '../lib/friends';

/**
 * Friends mutations for the Convex backend
 *
 * These functions handle friend request operations with proper authentication.
 */

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = mutation({
  args: {
    addresseePersonId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { addresseePersonId }) => {
    const { person } = await requireAuth(ctx);
    return sendFriendRequestForPerson(ctx, person, { addresseePersonId });
  },
});

/**
 * Accept a friend request
 */
export const acceptFriendRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { friendshipId }) => {
    const { person } = await requireAuth(ctx);
    return acceptFriendRequestForPerson(ctx, person, { friendshipId });
  },
});

/**
 * Decline a friend request
 */
export const declineFriendRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { friendshipId }) => {
    const { person } = await requireAuth(ctx);
    return declineFriendRequestForPerson(ctx, person, { friendshipId });
  },
});

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { friendshipId }) => {
    const { person } = await requireAuth(ctx);
    return cancelFriendRequestForPerson(ctx, person, { friendshipId });
  },
});

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = mutation({
  args: {
    friendshipId: v.id('friendships'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { friendshipId }) => {
    const { person } = await requireAuth(ctx);
    return removeFriendForPerson(ctx, person, { friendshipId });
  },
});

/**
 * Remove a friend by person ID (alternative to using friendshipId)
 */
export const removeFriendByPersonId = mutation({
  args: {
    personId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { personId }) => {
    const { person } = await requireAuth(ctx);
    return removeFriendByPersonIdForPerson(ctx, person, { personId });
  },
});

/**
 * Block a user.
 * Also removes any existing friendship and cancels pending friend requests.
 */
export const blockUser = mutation({
  args: {
    personId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { personId }) => {
    const { person } = await requireAuth(ctx);
    return blockUserForPerson(ctx, person, { personId });
  },
});

/**
 * Unblock a user
 */
export const unblockUser = mutation({
  args: {
    personId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { personId }) => {
    const { person } = await requireAuth(ctx);
    return unblockUserForPerson(ctx, person, { personId });
  },
});

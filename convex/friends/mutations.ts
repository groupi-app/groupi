import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth } from '../auth';
import { createNotification } from '../lib/notifications';

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

    // Can't send friend request to yourself
    if (person._id === addresseePersonId) {
      throw new ConvexError("You can't send a friend request to yourself");
    }

    // Check if addressee exists
    const addressee = await ctx.db.get(addresseePersonId);
    if (!addressee) {
      throw new ConvexError('User not found');
    }

    // Check if there's already a friendship between these users (in either direction)
    const existingAsRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', person._id).eq('addresseeId', addresseePersonId)
      )
      .first();

    if (existingAsRequester) {
      if (existingAsRequester.status === 'PENDING') {
        throw new ConvexError('Friend request already sent');
      }
      if (existingAsRequester.status === 'ACCEPTED') {
        throw new ConvexError('You are already friends');
      }
      // If DECLINED, allow re-sending (delete old and create new)
      await ctx.db.delete(existingAsRequester._id);
    }

    const existingAsAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', addresseePersonId).eq('addresseeId', person._id)
      )
      .first();

    if (existingAsAddressee) {
      if (existingAsAddressee.status === 'PENDING') {
        // They already sent a request - auto-accept it
        await ctx.db.patch(existingAsAddressee._id, {
          status: 'ACCEPTED',
          updatedAt: Date.now(),
        });

        // Notify them that you accepted
        await createNotification(ctx, {
          personId: addresseePersonId,
          type: 'FRIEND_REQUEST_ACCEPTED',
          authorId: person._id,
        });

        return {
          friendshipId: existingAsAddressee._id,
          status: 'ACCEPTED' as const,
          message: 'Friend request accepted',
        };
      }
      if (existingAsAddressee.status === 'ACCEPTED') {
        throw new ConvexError('You are already friends');
      }
      // If DECLINED by us, allow them to re-request
      await ctx.db.delete(existingAsAddressee._id);
    }

    // Create new friendship request
    const friendshipId = await ctx.db.insert('friendships', {
      requesterId: person._id,
      addresseeId: addresseePersonId,
      status: 'PENDING',
      createdAt: Date.now(),
    });

    // Notify the addressee about the friend request
    await createNotification(ctx, {
      personId: addresseePersonId,
      type: 'FRIEND_REQUEST_RECEIVED',
      authorId: person._id,
    });

    return {
      friendshipId,
      status: 'PENDING' as const,
      message: 'Friend request sent',
    };
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

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new ConvexError('Friend request not found');
    }

    // Only the addressee can accept
    if (friendship.addresseeId !== person._id) {
      throw new ConvexError("You can't accept this friend request");
    }

    if (friendship.status !== 'PENDING') {
      throw new ConvexError('This request has already been processed');
    }

    // Update to accepted
    await ctx.db.patch(friendshipId, {
      status: 'ACCEPTED',
      updatedAt: Date.now(),
    });

    // Notify the requester that their request was accepted
    await createNotification(ctx, {
      personId: friendship.requesterId,
      type: 'FRIEND_REQUEST_ACCEPTED',
      authorId: person._id,
    });

    return {
      success: true,
      message: 'Friend request accepted',
    };
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

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new ConvexError('Friend request not found');
    }

    // Only the addressee can decline
    if (friendship.addresseeId !== person._id) {
      throw new ConvexError("You can't decline this friend request");
    }

    if (friendship.status !== 'PENDING') {
      throw new ConvexError('This request has already been processed');
    }

    // Update to declined
    await ctx.db.patch(friendshipId, {
      status: 'DECLINED',
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: 'Friend request declined',
    };
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

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new ConvexError('Friend request not found');
    }

    // Only the requester can cancel
    if (friendship.requesterId !== person._id) {
      throw new ConvexError("You can't cancel this friend request");
    }

    if (friendship.status !== 'PENDING') {
      throw new ConvexError('This request has already been processed');
    }

    // Delete the friendship request
    await ctx.db.delete(friendshipId);

    return {
      success: true,
      message: 'Friend request cancelled',
    };
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

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new ConvexError('Friendship not found');
    }

    // Either party can remove the friendship
    if (
      friendship.requesterId !== person._id &&
      friendship.addresseeId !== person._id
    ) {
      throw new ConvexError("You can't remove this friendship");
    }

    if (friendship.status !== 'ACCEPTED') {
      throw new ConvexError('You are not friends with this user');
    }

    // Delete the friendship
    await ctx.db.delete(friendshipId);

    return {
      success: true,
      message: 'Friend removed',
    };
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

    // Check both directions
    const asRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', person._id).eq('addresseeId', personId)
      )
      .first();

    if (asRequester && asRequester.status === 'ACCEPTED') {
      await ctx.db.delete(asRequester._id);
      return { success: true, message: 'Friend removed' };
    }

    const asAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', personId).eq('addresseeId', person._id)
      )
      .first();

    if (asAddressee && asAddressee.status === 'ACCEPTED') {
      await ctx.db.delete(asAddressee._id);
      return { success: true, message: 'Friend removed' };
    }

    throw new ConvexError('You are not friends with this user');
  },
});

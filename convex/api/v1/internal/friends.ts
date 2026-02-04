import {
  internalQuery,
  internalMutation,
  QueryCtx,
  MutationCtx,
} from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { authComponent, AuthUserId } from '../../../auth';
import { createNotification } from '../../../lib/notifications';

/**
 * Internal queries and mutations for friends API routes
 */

// Get person with user data helper for queries
async function getPersonWithUserDataQuery(
  ctx: QueryCtx,
  personId: Id<'persons'>
) {
  const person = await ctx.db.get(personId);
  if (!person) return null;

  const user = await authComponent.getAnyUserById(
    ctx,
    person.userId as AuthUserId
  );
  if (!user) return null;

  return {
    person,
    user,
  };
}

// Get person with user data helper for mutations
async function getPersonWithUserDataMutation(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  const person = await ctx.db.get(personId);
  if (!person) return null;

  const user = await authComponent.getAnyUserById(
    ctx,
    person.userId as AuthUserId
  );
  if (!user) return null;

  return {
    person,
    user,
  };
}

export const listFriends = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const pid = personId as Id<'persons'>;

    // Get accepted friendships where user is requester
    const asRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', pid))
      .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
      .collect();

    // Get accepted friendships where user is addressee
    const asAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_addressee', q => q.eq('addresseeId', pid))
      .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
      .collect();

    // Get friend person IDs and map to friendship IDs
    const friendData = [
      ...asRequester.map(f => ({
        friendPersonId: f.addresseeId,
        friendshipId: f._id,
      })),
      ...asAddressee.map(f => ({
        friendPersonId: f.requesterId,
        friendshipId: f._id,
      })),
    ];

    // Get friend details
    const friends = await Promise.all(
      friendData.map(async ({ friendPersonId, friendshipId }) => {
        const data = await getPersonWithUserDataQuery(ctx, friendPersonId);
        if (!data) return null;

        return {
          friendshipId,
          personId: friendPersonId,
          userId: data.person.userId,
          name: data.user.name ?? null,
          username: data.user.username ?? null,
          image: data.user.image ?? null,
          lastSeen: data.person.lastSeen ?? null,
        };
      })
    );

    return friends.filter(f => f !== null);
  },
});

export const listPendingRequests = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const pid = personId as Id<'persons'>;

    // Get pending requests where user is addressee
    const requests = await ctx.db
      .query('friendships')
      .withIndex('by_addressee_status', q =>
        q.eq('addresseeId', pid).eq('status', 'PENDING')
      )
      .collect();

    // Get requester details
    const pendingRequests = await Promise.all(
      requests.map(async request => {
        const data = await getPersonWithUserDataQuery(ctx, request.requesterId);
        if (!data) return null;

        return {
          friendshipId: request._id,
          personId: request.requesterId,
          userId: data.person.userId,
          name: data.user.name ?? null,
          username: data.user.username ?? null,
          image: data.user.image ?? null,
          createdAt: request.createdAt,
        };
      })
    );

    return pendingRequests.filter(r => r !== null);
  },
});

export const listSentRequests = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const pid = personId as Id<'persons'>;

    // Get pending requests where user is requester
    const requests = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', pid))
      .filter(q => q.eq(q.field('status'), 'PENDING'))
      .collect();

    // Get addressee details
    const sentRequests = await Promise.all(
      requests.map(async request => {
        const data = await getPersonWithUserDataQuery(ctx, request.addresseeId);
        if (!data) return null;

        return {
          friendshipId: request._id,
          personId: request.addresseeId,
          userId: data.person.userId,
          name: data.user.name ?? null,
          username: data.user.username ?? null,
          image: data.user.image ?? null,
          createdAt: request.createdAt,
        };
      })
    );

    return sentRequests.filter(r => r !== null);
  },
});

export const sendFriendRequest = internalMutation({
  args: {
    requesterId: v.string(),
    addresseeId: v.string(),
  },
  handler: async (ctx, { requesterId, addresseeId }) => {
    const reqId = requesterId as Id<'persons'>;
    const addrId = addresseeId as Id<'persons'>;

    if (reqId === addrId) {
      throw new Error("You can't send a friend request to yourself");
    }

    // Check if addressee exists
    const addressee = await ctx.db.get(addrId);
    if (!addressee) {
      throw new Error('User not found');
    }

    // Check if there's already a friendship
    const existingAsRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', reqId).eq('addresseeId', addrId)
      )
      .first();

    const existingAsAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', addrId).eq('addresseeId', reqId)
      )
      .first();

    // If they sent us a request, auto-accept it
    if (existingAsAddressee && existingAsAddressee.status === 'PENDING') {
      await ctx.db.patch(existingAsAddressee._id, {
        status: 'ACCEPTED',
        updatedAt: Date.now(),
      });

      // Get requester info for notification
      const requesterData = await getPersonWithUserDataMutation(ctx, reqId);
      if (requesterData) {
        await createNotification(ctx, {
          personId: addrId,
          authorId: reqId,
          type: 'FRIEND_REQUEST_ACCEPTED',
        });
      }

      return {
        friendshipId: existingAsAddressee._id,
        status: 'ACCEPTED' as const,
        message: 'Friend request accepted',
      };
    }

    // Check for existing request from us
    if (existingAsRequester) {
      if (existingAsRequester.status === 'ACCEPTED') {
        throw new Error('You are already friends');
      }
      if (existingAsRequester.status === 'PENDING') {
        throw new Error('Friend request already sent');
      }
      // If declined, allow re-sending
    }

    // Create new friend request
    const now = Date.now();
    const friendshipId = await ctx.db.insert('friendships', {
      requesterId: reqId,
      addresseeId: addrId,
      status: 'PENDING',
      createdAt: now,
    });

    // Get requester info for notification
    const requesterData = await getPersonWithUserDataMutation(ctx, reqId);
    if (requesterData) {
      await createNotification(ctx, {
        personId: addrId,
        authorId: reqId,
        type: 'FRIEND_REQUEST_RECEIVED',
      });
    }

    return {
      friendshipId,
      status: 'PENDING' as const,
      message: 'Friend request sent',
    };
  },
});

export const acceptFriendRequest = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    const fId = friendshipId as Id<'friendships'>;
    const pId = personId as Id<'persons'>;

    const friendship = await ctx.db.get(fId);
    if (!friendship) {
      throw new Error('Friend request not found');
    }

    if (friendship.addresseeId !== pId) {
      throw new Error('Not authorized to accept this request');
    }

    if (friendship.status !== 'PENDING') {
      throw new Error('This request has already been processed');
    }

    await ctx.db.patch(fId, {
      status: 'ACCEPTED',
      updatedAt: Date.now(),
    });

    // Notify the requester
    const accepterData = await getPersonWithUserDataMutation(ctx, pId);
    if (accepterData) {
      await createNotification(ctx, {
        personId: friendship.requesterId,
        authorId: pId,
        type: 'FRIEND_REQUEST_ACCEPTED',
      });
    }

    return { success: true };
  },
});

export const declineFriendRequest = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    const fId = friendshipId as Id<'friendships'>;
    const pId = personId as Id<'persons'>;

    const friendship = await ctx.db.get(fId);
    if (!friendship) {
      throw new Error('Friend request not found');
    }

    if (friendship.addresseeId !== pId) {
      throw new Error('Not authorized to decline this request');
    }

    if (friendship.status !== 'PENDING') {
      throw new Error('This request has already been processed');
    }

    await ctx.db.patch(fId, {
      status: 'DECLINED',
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const cancelFriendRequest = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    const fId = friendshipId as Id<'friendships'>;
    const pId = personId as Id<'persons'>;

    const friendship = await ctx.db.get(fId);
    if (!friendship) {
      throw new Error('Friend request not found');
    }

    if (friendship.requesterId !== pId) {
      throw new Error('Not authorized to cancel this request');
    }

    if (friendship.status !== 'PENDING') {
      throw new Error('This request has already been processed');
    }

    await ctx.db.delete(fId);

    return { success: true };
  },
});

export const removeFriend = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    const fId = friendshipId as Id<'friendships'>;
    const pId = personId as Id<'persons'>;

    const friendship = await ctx.db.get(fId);
    if (!friendship) {
      throw new Error('Friendship not found');
    }

    // Check if the person is part of this friendship
    if (friendship.requesterId !== pId && friendship.addresseeId !== pId) {
      throw new Error('Not authorized to remove this friendship');
    }

    if (friendship.status !== 'ACCEPTED') {
      throw new Error('Not a friend');
    }

    await ctx.db.delete(fId);

    return { success: true };
  },
});

export const searchUsers = internalQuery({
  args: {
    personId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, { personId, searchTerm }) => {
    const pId = personId as Id<'persons'>;
    const term = searchTerm.toLowerCase().trim();

    if (term.length < 2) {
      return [];
    }

    // Get all users (in production, you'd want a proper search index)
    const allPersons = await ctx.db.query('persons').collect();

    const results = await Promise.all(
      allPersons.map(async person => {
        if (person._id === pId) return null;

        const user = await authComponent.getAnyUserById(
          ctx,
          person.userId as AuthUserId
        );
        if (!user) return null;

        // Check if username matches (only search by username)
        const username = user.username?.toLowerCase() ?? '';

        if (!username.includes(term)) {
          return null;
        }

        // Get friendship status
        const asRequester = await ctx.db
          .query('friendships')
          .withIndex('by_requester_addressee', q =>
            q.eq('requesterId', pId).eq('addresseeId', person._id)
          )
          .first();

        const asAddressee = await ctx.db
          .query('friendships')
          .withIndex('by_requester_addressee', q =>
            q.eq('requesterId', person._id).eq('addresseeId', pId)
          )
          .first();

        type FriendshipStatusType =
          | 'none'
          | 'pending_sent'
          | 'pending_received'
          | 'friends'
          | 'declined';
        let friendshipStatus: FriendshipStatusType = 'none';
        let friendshipId: string | null = null;

        if (asRequester) {
          friendshipId = asRequester._id;
          if (asRequester.status === 'ACCEPTED') {
            friendshipStatus = 'friends';
          } else if (asRequester.status === 'PENDING') {
            friendshipStatus = 'pending_sent';
          } else if (asRequester.status === 'DECLINED') {
            friendshipStatus = 'none';
          }
        } else if (asAddressee) {
          friendshipId = asAddressee._id;
          if (asAddressee.status === 'ACCEPTED') {
            friendshipStatus = 'friends';
          } else if (asAddressee.status === 'PENDING') {
            friendshipStatus = 'pending_received';
          }
        }

        return {
          personId: person._id as string,
          userId: person.userId,
          name: user.name ?? null,
          username: user.username ?? null,
          image: user.image ?? null,
          friendshipStatus,
          friendshipId,
        };
      })
    );

    return results.filter(r => r !== null).slice(0, 20);
  },
});

type FriendshipStatusResult =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends'
  | 'declined'
  | 'self';

export const getFriendshipStatus = internalQuery({
  args: {
    personId: v.string(),
    targetPersonId: v.string(),
  },
  handler: async (
    ctx,
    { personId, targetPersonId }
  ): Promise<{
    status: FriendshipStatusResult;
    friendshipId: string | null;
  }> => {
    const pId = personId as Id<'persons'>;
    const tId = targetPersonId as Id<'persons'>;

    if (pId === tId) {
      return { status: 'self' as const, friendshipId: null };
    }

    const asRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', pId).eq('addresseeId', tId)
      )
      .first();

    const asAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', tId).eq('addresseeId', pId)
      )
      .first();

    if (asRequester) {
      if (asRequester.status === 'ACCEPTED') {
        return {
          status: 'friends' as const,
          friendshipId: asRequester._id as string,
        };
      } else if (asRequester.status === 'PENDING') {
        return {
          status: 'pending_sent' as const,
          friendshipId: asRequester._id as string,
        };
      }
    }

    if (asAddressee) {
      if (asAddressee.status === 'ACCEPTED') {
        return {
          status: 'friends' as const,
          friendshipId: asAddressee._id as string,
        };
      } else if (asAddressee.status === 'PENDING') {
        return {
          status: 'pending_received' as const,
          friendshipId: asAddressee._id as string,
        };
      }
    }

    return { status: 'none' as const, friendshipId: null };
  },
});

import {
  internalQuery,
  internalMutation,
  QueryCtx,
} from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { authComponent, AuthUserId } from '../../../auth';
import { checkIsBlocked } from '../../../lib/privacy';
import { ConvexError } from 'convex/values';
import {
  sendFriendRequestForPerson,
  acceptFriendRequestForPerson,
  declineFriendRequestForPerson,
  cancelFriendRequestForPerson,
  removeFriendForPerson,
} from '../../../lib/friends';

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

export const listFriends = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const pid = personId as Id<'persons'>;

    // Get accepted friendships using compound indexes
    const [asRequester, asAddressee] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_requester_status', q =>
          q.eq('requesterId', pid).eq('status', 'ACCEPTED')
        )
        .collect(),
      ctx.db
        .query('friendships')
        .withIndex('by_addressee_status', q =>
          q.eq('addresseeId', pid).eq('status', 'ACCEPTED')
        )
        .collect(),
    ]);

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

    // Get pending requests where user is requester using compound index
    const requests = await ctx.db
      .query('friendships')
      .withIndex('by_requester_status', q =>
        q.eq('requesterId', pid).eq('status', 'PENDING')
      )
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
    try {
      const targetId = ctx.db.normalizeId('persons', addresseeId);
      if (!targetId) throw new ConvexError('User or friendship not found');
      return await sendFriendRequestForPerson(
        ctx,
        { _id: requesterId as Id<'persons'> },
        { addresseePersonId: targetId }
      );
    } catch (error) {
      if (!(error instanceof ConvexError)) throw error;
      const message = String(error.data);
      throw new ConvexError({
        code:
          message.includes('Not authorized') ||
          /can't (accept|decline|cancel|remove)/.test(message)
            ? 'FORBIDDEN'
            : message.includes('not found')
              ? 'NOT_FOUND'
              : 'VALIDATION_ERROR',
        message,
      });
    }
  },
});

export const acceptFriendRequest = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    try {
      const targetId = ctx.db.normalizeId('friendships', friendshipId);
      if (!targetId) throw new ConvexError('User or friendship not found');
      return await acceptFriendRequestForPerson(
        ctx,
        { _id: personId as Id<'persons'> },
        { friendshipId: targetId }
      );
    } catch (error) {
      if (!(error instanceof ConvexError)) throw error;
      const message = String(error.data);
      throw new ConvexError({
        code:
          message.includes('Not authorized') ||
          /can't (accept|decline|cancel|remove)/.test(message)
            ? 'FORBIDDEN'
            : message.includes('not found')
              ? 'NOT_FOUND'
              : 'VALIDATION_ERROR',
        message,
      });
    }
  },
});

export const declineFriendRequest = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    try {
      const targetId = ctx.db.normalizeId('friendships', friendshipId);
      if (!targetId) throw new ConvexError('User or friendship not found');
      return await declineFriendRequestForPerson(
        ctx,
        { _id: personId as Id<'persons'> },
        { friendshipId: targetId }
      );
    } catch (error) {
      if (!(error instanceof ConvexError)) throw error;
      const message = String(error.data);
      throw new ConvexError({
        code:
          message.includes('Not authorized') ||
          /can't (accept|decline|cancel|remove)/.test(message)
            ? 'FORBIDDEN'
            : message.includes('not found')
              ? 'NOT_FOUND'
              : 'VALIDATION_ERROR',
        message,
      });
    }
  },
});

export const cancelFriendRequest = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    try {
      const targetId = ctx.db.normalizeId('friendships', friendshipId);
      if (!targetId) throw new ConvexError('User or friendship not found');
      return await cancelFriendRequestForPerson(
        ctx,
        { _id: personId as Id<'persons'> },
        { friendshipId: targetId }
      );
    } catch (error) {
      if (!(error instanceof ConvexError)) throw error;
      const message = String(error.data);
      throw new ConvexError({
        code:
          message.includes('Not authorized') ||
          /can't (accept|decline|cancel|remove)/.test(message)
            ? 'FORBIDDEN'
            : message.includes('not found')
              ? 'NOT_FOUND'
              : 'VALIDATION_ERROR',
        message,
      });
    }
  },
});

export const removeFriend = internalMutation({
  args: {
    friendshipId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { friendshipId, personId }) => {
    try {
      const targetId = ctx.db.normalizeId('friendships', friendshipId);
      if (!targetId) throw new ConvexError('User or friendship not found');
      return await removeFriendForPerson(
        ctx,
        { _id: personId as Id<'persons'> },
        { friendshipId: targetId }
      );
    } catch (error) {
      if (!(error instanceof ConvexError)) throw error;
      const message = String(error.data);
      throw new ConvexError({
        code:
          message.includes('Not authorized') ||
          /can't (accept|decline|cancel|remove)/.test(message)
            ? 'FORBIDDEN'
            : message.includes('not found')
              ? 'NOT_FOUND'
              : 'VALIDATION_ERROR',
        message,
      });
    }
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
        if (person._id === pId || (await checkIsBlocked(ctx, pId, person._id)))
          return null;

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

    if (await checkIsBlocked(ctx, pId, tId))
      return { status: 'none' as const, friendshipId: null };
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

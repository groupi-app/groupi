import { query, QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import {
  getCurrentPerson,
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
} from '../auth';
import { Id, Doc } from '../_generated/dataModel';
import { components } from '../_generated/api';

/**
 * Helper to get user data with fallback for test environment
 */
async function getUserDataFallback(
  ctx: QueryCtx,
  person: Doc<'persons'>
): Promise<{
  name: string | null;
  username: string | null;
  image: string | null;
}> {
  try {
    const user = await authComponent.getAnyUserById(
      ctx,
      person.userId as AuthUserId
    );
    if (user) {
      return {
        name: user.name || null,
        username: (user as ExtendedAuthUser).username || null,
        image: user.image || null,
      };
    }
  } catch (error) {
    // Component not registered (test environment) - return stub data
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not registered')) {
      return {
        name: null,
        username: null,
        image: null,
      };
    }
    throw error;
  }
  return {
    name: null,
    username: null,
    image: null,
  };
}

/**
 * Friends queries for the Convex backend
 *
 * These functions handle friend-related data retrieval with proper authentication.
 */

/**
 * Get all accepted friends for the current user
 */
export const getFriends = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Get friendships where current user is requester
    const asRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', currentPerson._id))
      .collect();

    // Get friendships where current user is addressee
    const asAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_addressee', q => q.eq('addresseeId', currentPerson._id))
      .collect();

    // Filter to only accepted friendships
    const acceptedAsRequester = asRequester.filter(
      f => f.status === 'ACCEPTED'
    );
    const acceptedAsAddressee = asAddressee.filter(
      f => f.status === 'ACCEPTED'
    );

    // Create a map of personId to friendshipId
    const friendshipMap = new Map<string, string>();
    acceptedAsRequester.forEach(f => friendshipMap.set(f.addresseeId, f._id));
    acceptedAsAddressee.forEach(f => friendshipMap.set(f.requesterId, f._id));

    // Get friend person IDs
    const friendPersonIds = [
      ...acceptedAsRequester.map(f => f.addresseeId),
      ...acceptedAsAddressee.map(f => f.requesterId),
    ];

    // Fetch friend details
    const friends = await Promise.all(
      friendPersonIds.map(async personId => {
        const person = await ctx.db.get(personId);
        if (!person) return null;

        const userData = await getUserDataFallback(ctx, person);
        const friendshipId = friendshipMap.get(personId);

        return {
          friendshipId: friendshipId as Id<'friendships'>,
          personId: person._id,
          userId: person.userId,
          name: userData.name,
          username: userData.username,
          image: userData.image,
          lastSeen: person.lastSeen || null,
        };
      })
    );

    return friends.filter(Boolean);
  },
});

/**
 * Get pending friend requests received by current user
 */
export const getPendingRequests = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Get pending requests where current user is the addressee
    const pendingRequests = await ctx.db
      .query('friendships')
      .withIndex('by_addressee_status', q =>
        q.eq('addresseeId', currentPerson._id).eq('status', 'PENDING')
      )
      .collect();

    // Fetch requester details
    const requests = await Promise.all(
      pendingRequests.map(async friendship => {
        const person = await ctx.db.get(friendship.requesterId);
        if (!person) return null;

        const userData = await getUserDataFallback(ctx, person);
        const mutualEventCount = await getMutualEventCount(
          ctx,
          currentPerson._id,
          person._id
        );

        return {
          friendshipId: friendship._id,
          personId: person._id,
          userId: person.userId,
          name: userData.name,
          username: userData.username,
          image: userData.image,
          createdAt: friendship.createdAt,
          mutualEventCount,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

/**
 * Get friend requests sent by current user that are still pending
 */
export const getSentRequests = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Get pending requests where current user is the requester
    const sentRequests = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', currentPerson._id))
      .filter(q => q.eq(q.field('status'), 'PENDING'))
      .collect();

    // Fetch addressee details
    const requests = await Promise.all(
      sentRequests.map(async friendship => {
        const person = await ctx.db.get(friendship.addresseeId);
        if (!person) return null;

        const userData = await getUserDataFallback(ctx, person);
        const mutualEventCount = await getMutualEventCount(
          ctx,
          currentPerson._id,
          person._id
        );

        return {
          friendshipId: friendship._id,
          personId: person._id,
          userId: person.userId,
          name: userData.name,
          username: userData.username,
          image: userData.image,
          createdAt: friendship.createdAt,
          mutualEventCount,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

/**
 * Get friendship status between current user and another person
 * Returns: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'declined'
 */
export const getFriendshipStatus = query({
  args: {
    targetPersonId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { targetPersonId }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return { status: 'none' as const, friendshipId: null };
    }

    // Can't be friends with yourself
    if (currentPerson._id === targetPersonId) {
      return { status: 'self' as const, friendshipId: null };
    }

    // Check if current user sent a request to target
    const asRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', currentPerson._id).eq('addresseeId', targetPersonId)
      )
      .first();

    if (asRequester) {
      if (asRequester.status === 'PENDING') {
        return {
          status: 'pending_sent' as const,
          friendshipId: asRequester._id,
        };
      }
      if (asRequester.status === 'ACCEPTED') {
        return { status: 'friends' as const, friendshipId: asRequester._id };
      }
      if (asRequester.status === 'DECLINED') {
        return { status: 'declined' as const, friendshipId: asRequester._id };
      }
    }

    // Check if target sent a request to current user
    const asAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_requester_addressee', q =>
        q.eq('requesterId', targetPersonId).eq('addresseeId', currentPerson._id)
      )
      .first();

    if (asAddressee) {
      if (asAddressee.status === 'PENDING') {
        return {
          status: 'pending_received' as const,
          friendshipId: asAddressee._id,
        };
      }
      if (asAddressee.status === 'ACCEPTED') {
        return { status: 'friends' as const, friendshipId: asAddressee._id };
      }
      if (asAddressee.status === 'DECLINED') {
        return { status: 'declined' as const, friendshipId: asAddressee._id };
      }
    }

    return { status: 'none' as const, friendshipId: null };
  },
});

/**
 * Search users by username (for adding friends)
 * Excludes current user and returns friendship status for each result
 * Optimized to process in batches and stop early when enough results found
 */
export const searchUsersByUsername = query({
  args: {
    searchTerm: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { searchTerm }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    const trimmedSearch = searchTerm.trim().toLowerCase();
    // Minimum username length is 3 characters
    if (trimmedSearch.length < 3) {
      return [];
    }

    const MAX_RESULTS = 10;
    const BATCH_SIZE = 50; // Larger batches for better parallelism

    // Get persons in batches to find matches more efficiently
    const persons = await ctx.db.query('persons').collect();

    // Filter out current user first
    const otherPersons = persons.filter(p => p._id !== currentPerson._id);

    // Process in batches to find matches
    const matchedPersons: Array<{
      person: Doc<'persons'>;
      userData: {
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }> = [];

    for (
      let i = 0;
      i < otherPersons.length && matchedPersons.length < MAX_RESULTS;
      i += BATCH_SIZE
    ) {
      const batch = otherPersons.slice(i, i + BATCH_SIZE);

      // Fetch user data for batch
      const batchResults = await Promise.all(
        batch.map(async person => {
          const userData = await getUserDataFallback(ctx, person);
          const username = userData.username?.toLowerCase() || '';

          // Check if username contains search term
          if (username.includes(trimmedSearch)) {
            return { person, userData };
          }
          return null;
        })
      );

      // Add matches
      for (const result of batchResults) {
        if (result && matchedPersons.length < MAX_RESULTS) {
          matchedPersons.push(result);
        }
      }
    }

    // Only fetch friendship status for matches (much fewer queries)
    const results = await Promise.all(
      matchedPersons.map(async ({ person, userData }) => {
        const friendshipStatus = await getFriendshipStatusHelper(
          ctx,
          currentPerson._id,
          person._id
        );

        return {
          personId: person._id,
          userId: person.userId,
          name: userData.name,
          username: userData.username,
          image: userData.image,
          friendshipStatus: friendshipStatus.status,
          friendshipId: friendshipStatus.friendshipId,
        };
      })
    );

    return results;
  },
});

/**
 * Search for a user by exact username match (case-insensitive)
 * Uses the Better Auth username index for instant lookup.
 * Designed to run in parallel with the fuzzy search for instant feedback.
 */
export const searchUserByExactUsername = query({
  args: {
    searchTerm: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { searchTerm }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return null;
    }

    const trimmedSearch = searchTerm.trim().toLowerCase();
    // Minimum username length is 3 characters
    if (trimmedSearch.length < 3) {
      return null;
    }

    // Use the Better Auth username index for instant lookup
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: 'username', operator: 'eq', value: trimmedSearch }],
    });

    if (!user) {
      return null;
    }

    // Get the person record for this user
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', user._id as string))
      .first();

    if (!person || person._id === currentPerson._id) {
      return null;
    }

    // Get friendship status
    const friendshipStatus = await getFriendshipStatusHelper(
      ctx,
      currentPerson._id,
      person._id
    );

    return {
      personId: person._id,
      userId: person.userId,
      name: user.name || null,
      username: (user as ExtendedAuthUser).username || null,
      image: user.image || null,
      friendshipStatus: friendshipStatus.status,
      friendshipId: friendshipStatus.friendshipId,
    };
  },
});

/**
 * Helper to count mutual events between two persons
 */
async function getMutualEventCount(
  ctx: QueryCtx,
  personId1: Id<'persons'>,
  personId2: Id<'persons'>
): Promise<number> {
  // Get events for person 1
  const memberships1 = await ctx.db
    .query('memberships')
    .withIndex('by_person', q => q.eq('personId', personId1))
    .collect();
  const eventIds1 = new Set(memberships1.map(m => m.eventId));

  // Get events for person 2
  const memberships2 = await ctx.db
    .query('memberships')
    .withIndex('by_person', q => q.eq('personId', personId2))
    .collect();

  // Count overlapping events
  let count = 0;
  for (const m of memberships2) {
    if (eventIds1.has(m.eventId)) {
      count++;
    }
  }

  return count;
}

/**
 * Helper to get mutual friends between current user and a target person
 * Returns count and up to 3 sample friend avatars for display
 */
async function getMutualFriendsData(
  ctx: QueryCtx,
  currentPersonId: Id<'persons'>,
  targetPersonId: Id<'persons'>
): Promise<{
  count: number;
  sampleAvatars: Array<{ image: string | null; name: string | null }>;
}> {
  // Get current user's friends (ACCEPTED friendships)
  const currentAsRequester = await ctx.db
    .query('friendships')
    .withIndex('by_requester', q => q.eq('requesterId', currentPersonId))
    .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
    .collect();
  const currentAsAddressee = await ctx.db
    .query('friendships')
    .withIndex('by_addressee', q => q.eq('addresseeId', currentPersonId))
    .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
    .collect();

  const currentFriendIds = new Set([
    ...currentAsRequester.map(f => f.addresseeId),
    ...currentAsAddressee.map(f => f.requesterId),
  ]);

  // Get target's friends
  const targetAsRequester = await ctx.db
    .query('friendships')
    .withIndex('by_requester', q => q.eq('requesterId', targetPersonId))
    .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
    .collect();
  const targetAsAddressee = await ctx.db
    .query('friendships')
    .withIndex('by_addressee', q => q.eq('addresseeId', targetPersonId))
    .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
    .collect();

  const targetFriendIds = new Set([
    ...targetAsRequester.map(f => f.addresseeId),
    ...targetAsAddressee.map(f => f.requesterId),
  ]);

  // Find mutual friends (intersection)
  const mutualFriendIds: Id<'persons'>[] = [];
  for (const friendId of currentFriendIds) {
    if (targetFriendIds.has(friendId)) {
      mutualFriendIds.push(friendId);
    }
  }

  // Get sample avatars (up to 3)
  const sampleIds = mutualFriendIds.slice(0, 3);
  const sampleAvatars = await Promise.all(
    sampleIds.map(async personId => {
      const person = await ctx.db.get(personId);
      if (!person) return { image: null, name: null };
      const userData = await getUserDataFallback(ctx, person);
      return { image: userData.image, name: userData.name };
    })
  );

  return {
    count: mutualFriendIds.length,
    sampleAvatars,
  };
}

/**
 * Helper to get friendship status (used internally)
 */
async function getFriendshipStatusHelper(
  ctx: Parameters<typeof getCurrentPerson>[0],
  currentPersonId: Id<'persons'>,
  targetPersonId: Id<'persons'>
): Promise<{
  status: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'declined';
  friendshipId: Id<'friendships'> | null;
}> {
  // Check if current user sent a request to target
  const asRequester = await ctx.db
    .query('friendships')
    .withIndex('by_requester_addressee', q =>
      q.eq('requesterId', currentPersonId).eq('addresseeId', targetPersonId)
    )
    .first();

  if (asRequester) {
    if (asRequester.status === 'PENDING') {
      return { status: 'pending_sent', friendshipId: asRequester._id };
    }
    if (asRequester.status === 'ACCEPTED') {
      return { status: 'friends', friendshipId: asRequester._id };
    }
    if (asRequester.status === 'DECLINED') {
      return { status: 'declined', friendshipId: asRequester._id };
    }
  }

  // Check if target sent a request to current user
  const asAddressee = await ctx.db
    .query('friendships')
    .withIndex('by_requester_addressee', q =>
      q.eq('requesterId', targetPersonId).eq('addresseeId', currentPersonId)
    )
    .first();

  if (asAddressee) {
    if (asAddressee.status === 'PENDING') {
      return { status: 'pending_received', friendshipId: asAddressee._id };
    }
    if (asAddressee.status === 'ACCEPTED') {
      return { status: 'friends', friendshipId: asAddressee._id };
    }
    if (asAddressee.status === 'DECLINED') {
      return { status: 'declined', friendshipId: asAddressee._id };
    }
  }

  return { status: 'none', friendshipId: null };
}

/**
 * Get users who share mutual events with the current user
 * Returns users ordered by number of mutual events (descending)
 * Excludes users who are already friends
 */
export const getUsersWithMutualEvents = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Get all events the current user is a member of
    const myMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();

    const myEventIds = myMemberships.map(m => m.eventId);

    if (myEventIds.length === 0) {
      return [];
    }

    // Get all memberships for those events (other users)
    const mutualPersonCounts = new Map<
      Id<'persons'>,
      { count: number; eventIds: Id<'events'>[] }
    >();

    for (const eventId of myEventIds) {
      const eventMemberships = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect();

      for (const membership of eventMemberships) {
        // Skip current user
        if (membership.personId === currentPerson._id) continue;

        const existing = mutualPersonCounts.get(membership.personId);
        if (existing) {
          existing.count++;
          existing.eventIds.push(eventId);
        } else {
          mutualPersonCounts.set(membership.personId, {
            count: 1,
            eventIds: [eventId],
          });
        }
      }
    }

    // Get person details and friendship status for each mutual person
    const results = await Promise.all(
      Array.from(mutualPersonCounts.entries()).map(
        async ([personId, { count }]) => {
          const person = await ctx.db.get(personId);
          if (!person) return null;

          // Get friendship status
          const friendshipStatus = await getFriendshipStatusHelper(
            ctx,
            currentPerson._id,
            personId
          );

          // Skip users who are already friends
          if (friendshipStatus.status === 'friends') {
            return null;
          }

          const userData = await getUserDataFallback(ctx, person);

          // Get mutual friends data
          const mutualFriends = await getMutualFriendsData(
            ctx,
            currentPerson._id,
            personId
          );

          return {
            personId: person._id,
            userId: person.userId,
            name: userData.name,
            username: userData.username,
            image: userData.image,
            mutualEventCount: count,
            mutualFriendCount: mutualFriends.count,
            mutualFriendAvatars: mutualFriends.sampleAvatars,
            friendshipStatus: friendshipStatus.status,
            friendshipId: friendshipStatus.friendshipId,
          };
        }
      )
    );

    // Filter nulls and sort by mutual event count (descending)
    return results
      .filter(Boolean)
      .sort((a, b) => b!.mutualEventCount - a!.mutualEventCount)
      .slice(0, 20); // Limit to 20 suggestions
  },
});

/**
 * Get mutual friends between current user and a target user
 * Returns full friend details for display in profile dialog
 */
export const getMutualFriends = query({
  args: {
    targetUserId: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { targetUserId }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Get target person by userId
    const targetPerson = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', targetUserId))
      .first();

    if (!targetPerson || targetPerson._id === currentPerson._id) {
      return [];
    }

    // Get current user's friends
    const currentAsRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', currentPerson._id))
      .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
      .collect();
    const currentAsAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_addressee', q => q.eq('addresseeId', currentPerson._id))
      .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
      .collect();

    const currentFriendIds = new Set([
      ...currentAsRequester.map(f => f.addresseeId),
      ...currentAsAddressee.map(f => f.requesterId),
    ]);

    // Get target's friends
    const targetAsRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', targetPerson._id))
      .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
      .collect();
    const targetAsAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_addressee', q => q.eq('addresseeId', targetPerson._id))
      .filter(q => q.eq(q.field('status'), 'ACCEPTED'))
      .collect();

    const targetFriendIds = new Set([
      ...targetAsRequester.map(f => f.addresseeId),
      ...targetAsAddressee.map(f => f.requesterId),
    ]);

    // Find mutual friends
    const mutualFriendIds: Id<'persons'>[] = [];
    for (const friendId of currentFriendIds) {
      if (targetFriendIds.has(friendId)) {
        mutualFriendIds.push(friendId);
      }
    }

    // Get full details for each mutual friend
    const mutualFriends = await Promise.all(
      mutualFriendIds.map(async personId => {
        const person = await ctx.db.get(personId);
        if (!person) return null;
        const userData = await getUserDataFallback(ctx, person);
        return {
          personId: person._id,
          userId: person.userId,
          name: userData.name,
          username: userData.username,
          image: userData.image,
        };
      })
    );

    return mutualFriends.filter(Boolean);
  },
});

import { QueryCtx, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

/**
 * Privacy helpers for checking whether actions are allowed
 * based on target user's privacy settings and block lists.
 *
 * Defaults (when field is undefined): EVERYONE — backwards-compatible.
 */

/**
 * Check if two persons are friends (accepted friendship in either direction).
 * Extracted from eventInvites/queries.ts for reuse.
 */
export async function checkIfFriends(
  ctx: QueryCtx | MutationCtx,
  personId1: Id<'persons'>,
  personId2: Id<'persons'>
): Promise<boolean> {
  const asRequester = await ctx.db
    .query('friendships')
    .withIndex('by_requester_addressee', q =>
      q.eq('requesterId', personId1).eq('addresseeId', personId2)
    )
    .first();

  if (asRequester?.status === 'ACCEPTED') {
    return true;
  }

  const asAddressee = await ctx.db
    .query('friendships')
    .withIndex('by_requester_addressee', q =>
      q.eq('requesterId', personId2).eq('addresseeId', personId1)
    )
    .first();

  if (asAddressee?.status === 'ACCEPTED') {
    return true;
  }

  return false;
}

/**
 * Check if two persons share at least one event (both have memberships).
 */
export async function checkShareEvent(
  ctx: QueryCtx | MutationCtx,
  personId1: Id<'persons'>,
  personId2: Id<'persons'>
): Promise<boolean> {
  const memberships1 = await ctx.db
    .query('memberships')
    .withIndex('by_person', q => q.eq('personId', personId1))
    .collect();

  const eventIds1 = new Set(memberships1.map(m => m.eventId));

  const memberships2 = await ctx.db
    .query('memberships')
    .withIndex('by_person', q => q.eq('personId', personId2))
    .collect();

  for (const m of memberships2) {
    if (eventIds1.has(m.eventId)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if either person has blocked the other.
 * Returns true if there is a block in either direction.
 */
export async function checkIsBlocked(
  ctx: QueryCtx | MutationCtx,
  personId1: Id<'persons'>,
  personId2: Id<'persons'>
): Promise<boolean> {
  const block1 = await ctx.db
    .query('userBlocks')
    .withIndex('by_blocker_blocked', q =>
      q.eq('blockerId', personId1).eq('blockedId', personId2)
    )
    .first();

  if (block1) return true;

  const block2 = await ctx.db
    .query('userBlocks')
    .withIndex('by_blocker_blocked', q =>
      q.eq('blockerId', personId2).eq('blockedId', personId1)
    )
    .first();

  return !!block2;
}

/**
 * Check if sender is allowed to send a friend request to target.
 */
export async function checkCanSendFriendRequest(
  ctx: QueryCtx | MutationCtx,
  senderId: Id<'persons'>,
  targetPersonId: Id<'persons'>
): Promise<{ allowed: boolean; reason?: string }> {
  // Block check takes priority over all other settings
  const blocked = await checkIsBlocked(ctx, senderId, targetPersonId);
  if (blocked) {
    return {
      allowed: false,
      reason: 'This user is not accepting friend requests',
    };
  }

  const settings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', targetPersonId))
    .first();

  const policy = settings?.allowFriendRequestsFrom ?? 'EVERYONE';

  switch (policy) {
    case 'EVERYONE':
      return { allowed: true };

    case 'EVENT_MEMBERS': {
      const shared = await checkShareEvent(ctx, senderId, targetPersonId);
      if (shared) return { allowed: true };
      return {
        allowed: false,
        reason:
          'This user only accepts friend requests from people in their events',
      };
    }

    case 'NO_ONE':
      return {
        allowed: false,
        reason: 'This user is not accepting friend requests',
      };

    default:
      return { allowed: true };
  }
}

/**
 * Check if sender is allowed to send an event invite to target.
 */
export async function checkCanSendEventInvite(
  ctx: QueryCtx | MutationCtx,
  senderId: Id<'persons'>,
  targetPersonId: Id<'persons'>
): Promise<{ allowed: boolean; reason?: string }> {
  // Block check takes priority over all other settings
  const blocked = await checkIsBlocked(ctx, senderId, targetPersonId);
  if (blocked) {
    return {
      allowed: false,
      reason: 'This user is not accepting event invites',
    };
  }

  const settings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', targetPersonId))
    .first();

  const policy = settings?.allowEventInvitesFrom ?? 'EVERYONE';

  switch (policy) {
    case 'EVERYONE':
      return { allowed: true };

    case 'EVENT_MEMBERS': {
      const shared = await checkShareEvent(ctx, senderId, targetPersonId);
      if (shared) return { allowed: true };
      return {
        allowed: false,
        reason:
          'This user only accepts event invites from people in their events',
      };
    }

    case 'FRIENDS': {
      const friends = await checkIfFriends(ctx, senderId, targetPersonId);
      if (friends) return { allowed: true };
      return {
        allowed: false,
        reason: 'This user only accepts event invites from friends',
      };
    }

    case 'NO_ONE':
      return {
        allowed: false,
        reason: 'This user is not accepting event invites',
      };

    default:
      return { allowed: true };
  }
}

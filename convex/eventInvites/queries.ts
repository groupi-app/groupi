import { query, QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import { components } from '../_generated/api';
import {
  getCurrentPerson,
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
} from '../auth';
import { Id, Doc } from '../_generated/dataModel';
import { checkIfFriends } from '../lib/privacy';

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
 * Event Invites queries for the Convex backend
 *
 * These functions handle event invite data retrieval with proper authentication.
 */

/**
 * Get pending event invites received by the current user
 */
export const getPendingEventInvites = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Get pending invites for current user
    const pendingInvites = await ctx.db
      .query('eventInvites')
      .withIndex('by_invitee_status', q =>
        q.eq('inviteeId', currentPerson._id).eq('status', 'PENDING')
      )
      .collect();

    // Fetch details for each invite
    const invites = await Promise.all(
      pendingInvites.map(async invite => {
        // Get event details
        const event = await ctx.db.get(invite.eventId);
        if (!event) return null;

        // Get inviter details
        const inviterPerson = await ctx.db.get(invite.inviterId);
        if (!inviterPerson) return null;

        const inviterData = await getUserDataFallback(ctx, inviterPerson);

        // Get event image URL if exists
        let eventImageUrl: string | null = null;
        if (event.imageStorageId) {
          eventImageUrl = await ctx.storage.getUrl(event.imageStorageId);
        }

        return {
          inviteId: invite._id,
          eventId: event._id,
          eventTitle: event.title,
          eventDescription: event.description || null,
          eventImageUrl,
          eventLocation: event.location || null,
          eventDateTime: event.chosenDateTime || null,
          memberCount: event.memberCount ?? 0,
          role: invite.role,
          message: invite.message || null,
          createdAt: invite.createdAt,
          inviter: {
            personId: inviterPerson._id,
            name: inviterData.name,
            username: inviterData.username,
            image: inviterData.image,
          },
        };
      })
    );

    return invites.filter(Boolean);
  },
});

/**
 * Get event invites sent for a specific event (for event managers)
 */
export const getSentEventInvites = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Verify user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      return [];
    }

    // Get all invites for this event
    const invites = await ctx.db
      .query('eventInvites')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    // Fetch details for each invite
    const inviteDetails = await Promise.all(
      invites.map(async invite => {
        // Get invitee details
        const inviteePerson = await ctx.db.get(invite.inviteeId);
        if (!inviteePerson) return null;

        const inviteeData = await getUserDataFallback(ctx, inviteePerson);

        // Get inviter details
        const inviterPerson = await ctx.db.get(invite.inviterId);
        const inviterData = inviterPerson
          ? await getUserDataFallback(ctx, inviterPerson)
          : { name: null, username: null, image: null };

        return {
          inviteId: invite._id,
          status: invite.status,
          role: invite.role,
          message: invite.message || null,
          createdAt: invite.createdAt,
          respondedAt: invite.respondedAt || null,
          invitee: {
            personId: inviteePerson._id,
            name: inviteeData.name,
            username: inviteeData.username,
            image: inviteeData.image,
          },
          inviter: {
            personId: invite.inviterId,
            name: inviterData.name,
            username: inviterData.username,
            image: inviterData.image,
          },
        };
      })
    );

    return inviteDetails.filter(Boolean);
  },
});

/**
 * Search users who can be invited to an event
 * Excludes: current members, already invited users (pending), banned users
 */
export const searchUsersForEventInvite = query({
  args: {
    eventId: v.id('events'),
    searchTerm: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, searchTerm }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return [];
    }

    // Verify user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      return [];
    }

    const trimmedSearch = searchTerm.trim().toLowerCase();
    // Minimum search length is 2 characters
    if (trimmedSearch.length < 2) {
      return [];
    }

    const MAX_RESULTS = 10;

    // Get existing members of the event
    const existingMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    const memberPersonIds = new Set(existingMemberships.map(m => m.personId));

    // Get banned users
    const bannedUsers = await ctx.db
      .query('eventBans')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    const bannedPersonIds = new Set(bannedUsers.map(b => b.personId));

    // Search users via Better Auth adapter instead of scanning persons table
    const matchingUsers = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'user',
        where: [
          {
            field: 'username',
            operator: 'contains',
            value: trimmedSearch,
            mode: 'insensitive',
          },
        ],
        paginationOpts: {
          cursor: null,
          numItems: MAX_RESULTS + 20,
        },
      }
    );

    const users = (matchingUsers as { data: ExtendedAuthUser[] }).data ?? [];

    const results: Array<{
      personId: Id<'persons'>;
      name: string | null;
      username: string | null;
      image: string | null;
      isFriend: boolean;
      hasPendingInvite: boolean;
      pendingInviteId: Id<'eventInvites'> | null;
    }> = [];

    for (const user of users) {
      if (results.length >= MAX_RESULTS) break;

      const userId = user._id?.toString();
      if (!userId) continue;

      const person = await ctx.db
        .query('persons')
        .withIndex('by_user_id', q => q.eq('userId', userId))
        .first();

      if (!person) continue;
      if (memberPersonIds.has(person._id)) continue;
      if (bannedPersonIds.has(person._id)) continue;

      const isFriend = await checkIfFriends(ctx, currentPerson._id, person._id);

      const pendingInvite = await ctx.db
        .query('eventInvites')
        .withIndex('by_event_invitee', q =>
          q.eq('eventId', eventId).eq('inviteeId', person._id)
        )
        .filter(q => q.eq(q.field('status'), 'PENDING'))
        .first();

      results.push({
        personId: person._id,
        name: user.name || null,
        username: user.username || null,
        image: user.image || null,
        isFriend,
        hasPendingInvite: !!pendingInvite,
        pendingInviteId: pendingInvite?._id || null,
      });
    }

    return results;
  },
});

/**
 * Search for an exact username match for event invite
 * Uses the Better Auth username index for instant lookup.
 * Returns single user or null if not found
 */
export const searchUserByExactUsernameForEventInvite = query({
  args: {
    eventId: v.id('events'),
    searchTerm: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, searchTerm }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return null;
    }

    // Verify user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      return null;
    }

    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch.length < 2) {
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

    // Check if already a member
    const existingMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (existingMembership) {
      return null;
    }

    // Check if banned
    const ban = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (ban) {
      return null;
    }

    // Check for pending invite
    const pendingInvite = await ctx.db
      .query('eventInvites')
      .withIndex('by_event_invitee', q =>
        q.eq('eventId', eventId).eq('inviteeId', person._id)
      )
      .filter(q => q.eq(q.field('status'), 'PENDING'))
      .first();

    // Check friendship status
    const isFriend = await checkIfFriends(ctx, currentPerson._id, person._id);

    return {
      personId: person._id,
      name: user.name || null,
      username: (user as ExtendedAuthUser).username || null,
      image: user.image || null,
      isFriend,
      hasPendingInvite: !!pendingInvite,
      pendingInviteId: pendingInvite?._id || null,
    };
  },
});

/**
 * Get count of pending invites for the current user (for badge display)
 */
export const getPendingInviteCount = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return 0;
    }

    const pendingInvites = await ctx.db
      .query('eventInvites')
      .withIndex('by_invitee_status', q =>
        q.eq('inviteeId', currentPerson._id).eq('status', 'PENDING')
      )
      .collect();

    return pendingInvites.length;
  },
});

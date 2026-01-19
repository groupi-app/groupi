import { mutation, query } from './_generated/server';
import { components } from './_generated/api';
import { v } from 'convex/values';
import { Presence } from '@convex-dev/presence';
import { Id } from './_generated/dataModel';
import { authComponent, ExtendedAuthUser, AuthUserId } from './auth';

/**
 * Presence tracking for Groupi
 *
 * Room IDs follow the pattern:
 * - "post:{postId}" - Users viewing a specific post
 * - "event:{eventId}" - Users viewing an event page
 * - "app" - Users online in the app (for global online status)
 *
 * User IDs are person IDs (Id<"persons">)
 */

export const presence = new Presence(components.presence);

/**
 * Send a heartbeat to indicate user is present in a room
 */
export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(), // Person ID
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // Note: Auth check could be added here, but we allow anonymous heartbeats
    // for simpler UX. The userId is the person ID from the client.
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

/**
 * Update user's presence data (e.g., typing status)
 */
export const updatePresenceData = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    data: v.optional(
      v.object({
        isTyping: v.optional(v.boolean()),
        lastActivity: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { roomId, userId, data }) => {
    return await presence.updateRoomUser(ctx, roomId, userId, data);
  },
});

/**
 * List all users present in a room with their custom data
 * Requires a valid roomToken obtained from heartbeat
 */
export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

/**
 * Disconnect a user session (called on page unload)
 */
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called via sendBeacon on page unload
    return await presence.disconnect(ctx, sessionToken);
  },
});

/**
 * Update user's last seen timestamp
 * Called periodically while user is active in the app
 */
export const updateLastSeen = mutation({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    // Get current user via Better Auth component
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { success: false };
    }

    // Find the person using the user's ID as string
    const userId = user._id.toString();
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .first();

    if (!person) {
      return { success: false };
    }

    // Update last seen in the persons table
    await ctx.db.patch(person._id, { lastSeen: Date.now() });

    return { success: true, personId: person._id };
  },
});

/**
 * Get typing indicators for a post
 * Requires a valid roomToken obtained from heartbeat
 * Returns users who are currently typing
 */
export const getTypingUsers = query({
  args: {
    roomToken: v.string(),
  },
  handler: async (ctx, { roomToken }) => {
    // list() returns presence data including custom data field
    const roomData = await presence.list(ctx, roomToken);

    if (!roomData || roomData.length === 0) {
      return [];
    }

    // Filter to users who are typing and online
    type PresenceData = { isTyping?: boolean; lastActivity?: number };
    const typingUsers = roomData.filter(
      user =>
        user.online &&
        (user.data as PresenceData | undefined)?.isTyping === true
    );

    // Get user details for each typing user using Better Auth component
    const typingUserDetails = await Promise.all(
      typingUsers.map(async user => {
        const person = await ctx.db.get(user.userId as Id<'persons'>);
        if (!person) return null;

        // Use Better Auth component to look up user data
        const userRecord = await authComponent.getAnyUserById(
          ctx,
          person.userId as AuthUserId
        );

        const extendedUser = userRecord as ExtendedAuthUser | null;
        return {
          personId: person._id,
          userId: person.userId,
          name: extendedUser?.name || extendedUser?.username || 'Anonymous',
          image: extendedUser?.image || null,
        };
      })
    );

    return typingUserDetails.filter(u => u !== null);
  },
});

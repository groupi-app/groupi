import { mutation, query, internalQuery } from './_generated/server';
import { components } from './_generated/api';
import { v } from 'convex/values';
import { Presence } from '@convex-dev/presence';
import { Id } from './_generated/dataModel';
import {
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
  getCurrentPerson,
} from './auth';

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
 * List all users present in a room by room ID
 * Internal query for server-side use (e.g., from mutations for notification skipping)
 * Does not require a roomToken, directly queries by roomId
 */
export const listRoom = internalQuery({
  args: {
    roomId: v.string(),
    onlineOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { roomId, onlineOnly = false }) => {
    return await presence.listRoom(ctx, roomId, onlineOnly);
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
    // Get current person (works in both production and tests)
    const person = await getCurrentPerson(ctx);
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

// ===== DISCORD-STYLE STATUS SYSTEM =====

/**
 * Status types for the Discord-style status system
 */
export type UserStatus = 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';
export type StatusVisibility = 'EVERYONE' | 'FRIENDS' | 'NONE';

/**
 * Duration options in milliseconds for status expiration
 */
export const STATUS_DURATIONS = {
  '15_MINUTES': 15 * 60 * 1000,
  '1_HOUR': 60 * 60 * 1000,
  '8_HOURS': 8 * 60 * 60 * 1000,
  '24_HOURS': 24 * 60 * 60 * 1000,
  '3_DAYS': 3 * 24 * 60 * 60 * 1000,
  FOREVER: null, // null means no expiration
} as const;

export type StatusDuration = keyof typeof STATUS_DURATIONS;

/**
 * Set user's status with optional duration
 * Duration can be one of: 15_MINUTES, 1_HOUR, 8_HOURS, 24_HOURS, 3_DAYS, or FOREVER
 */
export const setStatus = mutation({
  args: {
    status: v.union(
      v.literal('ONLINE'),
      v.literal('IDLE'),
      v.literal('DO_NOT_DISTURB'),
      v.literal('INVISIBLE')
    ),
    duration: v.optional(
      v.union(
        v.literal('15_MINUTES'),
        v.literal('1_HOUR'),
        v.literal('8_HOURS'),
        v.literal('24_HOURS'),
        v.literal('3_DAYS'),
        v.literal('FOREVER')
      )
    ),
    autoIdleEnabled: v.optional(v.boolean()),
    statusVisibility: v.optional(
      v.union(v.literal('EVERYONE'), v.literal('FRIENDS'), v.literal('NONE'))
    ),
  },
  handler: async (
    ctx,
    { status, duration, autoIdleEnabled, statusVisibility }
  ) => {
    // Get current person (works in both production and tests)
    const person = await getCurrentPerson(ctx);
    if (!person) {
      throw new Error('Authentication required');
    }

    const now = Date.now();

    // Calculate expiration time
    let statusExpiresAt: number | undefined;
    if (status !== 'ONLINE' && duration && duration !== 'FOREVER') {
      const durationMs = STATUS_DURATIONS[duration];
      if (durationMs) {
        statusExpiresAt = now + durationMs;
      }
    }

    // Build the update object
    const updateData: {
      status: UserStatus;
      statusSetAt: number;
      statusExpiresAt?: number;
      autoIdleEnabled?: boolean;
      statusVisibility?: StatusVisibility;
      updatedAt: number;
    } = {
      status,
      statusSetAt: now,
      statusExpiresAt,
      updatedAt: now,
    };

    // Only update optional fields if provided
    if (autoIdleEnabled !== undefined) {
      updateData.autoIdleEnabled = autoIdleEnabled;
    }
    if (statusVisibility !== undefined) {
      updateData.statusVisibility = statusVisibility;
    }

    await ctx.db.patch(person._id, updateData);

    return {
      success: true,
      status,
      expiresAt: statusExpiresAt,
    };
  },
});

/**
 * Clear status and revert to Online
 */
export const clearStatus = mutation({
  args: {},
  handler: async ctx => {
    // Get current person (works in both production and tests)
    const person = await getCurrentPerson(ctx);
    if (!person) {
      throw new Error('Authentication required');
    }

    await ctx.db.patch(person._id, {
      status: 'ONLINE',
      statusExpiresAt: undefined,
      statusSetAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get current user's status and settings
 */
export const getMyStatus = query({
  args: {},
  handler: async ctx => {
    // Get current person (works in both production and tests)
    const person = await getCurrentPerson(ctx);
    if (!person) {
      return null;
    }

    // Check if status has expired and should revert to ONLINE
    const now = Date.now();
    let effectiveStatus = person.status ?? 'ONLINE';
    let expiresAt = person.statusExpiresAt;

    if (expiresAt && now >= expiresAt) {
      // Status has expired - treat as ONLINE
      effectiveStatus = 'ONLINE';
      expiresAt = undefined;
    }

    return {
      status: effectiveStatus,
      statusExpiresAt: expiresAt,
      statusSetAt: person.statusSetAt,
      autoIdleEnabled: person.autoIdleEnabled ?? true, // Default to true
      statusVisibility: person.statusVisibility ?? 'EVERYONE', // Default to EVERYONE
      lastSeen: person.lastSeen,
    };
  },
});

/**
 * Get another person's status (respecting visibility settings)
 * Returns the visible status for the requesting user
 *
 * Display logic:
 * - INVISIBLE status: always shows as OFFLINE (hidden from others)
 * - Stale lastSeen (>5 min): shows as OFFLINE regardless of set status
 * - Active + ONLINE: shows as ONLINE
 * - Active + IDLE: shows as IDLE
 * - Active + DND: shows as DND
 *
 * Note: The functional DND behavior (notification muting) is separate from
 * display status. DND users with stale lastSeen will show as OFFLINE but
 * their notifications remain muted until DND expires.
 */
export const getPersonStatus = query({
  args: {
    personId: v.id('persons'),
  },
  handler: async (ctx, { personId }) => {
    const targetPerson = await ctx.db.get(personId);
    if (!targetPerson) {
      return null;
    }

    // Get the requesting person (works in both production and tests)
    const requestingPerson = await getCurrentPerson(ctx);

    // Check visibility settings
    const visibility = targetPerson.statusVisibility ?? 'EVERYONE';

    // NONE visibility: always show as offline
    if (visibility === 'NONE') {
      return {
        status: 'OFFLINE' as const,
        isOnline: false,
        lastSeen: null,
      };
    }

    // FRIENDS visibility: check if they are friends
    if (visibility === 'FRIENDS' && requestingPerson) {
      // Check if there's an accepted friendship between them
      const friendship = await ctx.db
        .query('friendships')
        .withIndex('by_requester_addressee', q =>
          q.eq('requesterId', requestingPerson._id).eq('addresseeId', personId)
        )
        .first();

      const reverseFriendship = await ctx.db
        .query('friendships')
        .withIndex('by_requester_addressee', q =>
          q.eq('requesterId', personId).eq('addresseeId', requestingPerson._id)
        )
        .first();

      const areFriends =
        (friendship && friendship.status === 'ACCEPTED') ||
        (reverseFriendship && reverseFriendship.status === 'ACCEPTED');

      if (!areFriends) {
        return {
          status: 'OFFLINE' as const,
          isOnline: false,
          lastSeen: null,
        };
      }
    }

    // Get effective status (checking expiration)
    const now = Date.now();
    let effectiveStatus = targetPerson.status ?? 'ONLINE';

    if (targetPerson.statusExpiresAt && now >= targetPerson.statusExpiresAt) {
      effectiveStatus = 'ONLINE';
    }

    // INVISIBLE status: show as offline to others
    if (effectiveStatus === 'INVISIBLE') {
      return {
        status: 'OFFLINE' as const,
        isOnline: false,
        lastSeen: null,
      };
    }

    // Check if online based on lastSeen (within 5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    const hasRecentActivity = targetPerson.lastSeen
      ? now - targetPerson.lastSeen < fiveMinutes
      : false;

    // If user has stale lastSeen, they're offline regardless of set status
    // This applies to ALL statuses including DND and IDLE
    // The functional DND behavior (notification muting) is handled separately
    if (!hasRecentActivity) {
      return {
        status: 'OFFLINE' as const,
        isOnline: false,
        lastSeen: targetPerson.lastSeen,
      };
    }

    // User has recent activity - show their actual status
    return {
      status: effectiveStatus,
      isOnline: effectiveStatus === 'ONLINE',
      lastSeen: targetPerson.lastSeen,
    };
  },
});

/**
 * Set auto-idle when user becomes inactive
 * Called by the client when visibility/idle state changes
 */
export const setAutoIdle = mutation({
  args: {
    isIdle: v.boolean(),
  },
  handler: async (ctx, { isIdle }) => {
    // Get current person (works in both production and tests)
    const person = await getCurrentPerson(ctx);
    if (!person) {
      return { success: false };
    }

    // Check if auto-idle is enabled
    if (person.autoIdleEnabled === false) {
      return { success: false, reason: 'auto_idle_disabled' };
    }

    // Don't override DND status with idle
    if (person.status === 'DO_NOT_DISTURB') {
      return { success: false, reason: 'dnd_active' };
    }

    // Don't override INVISIBLE status
    if (person.status === 'INVISIBLE') {
      return { success: false, reason: 'invisible_active' };
    }

    const now = Date.now();

    if (isIdle) {
      // Set to IDLE if not already idle
      if (person.status !== 'IDLE') {
        await ctx.db.patch(person._id, {
          status: 'IDLE',
          statusSetAt: now,
          statusExpiresAt: undefined, // Auto-idle doesn't expire
          updatedAt: now,
        });
        return { success: true, status: 'IDLE' as const };
      }
    } else {
      // Coming back from idle - revert to ONLINE
      if (person.status === 'IDLE') {
        await ctx.db.patch(person._id, {
          status: 'ONLINE',
          statusSetAt: now,
          statusExpiresAt: undefined,
          updatedAt: now,
        });
        return { success: true, status: 'ONLINE' as const };
      }
    }

    return { success: true };
  },
});

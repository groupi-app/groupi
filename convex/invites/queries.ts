import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireEventRole } from '../auth';

/**
 * Invites queries for the Convex backend
 *
 * These functions handle invite data retrieval with proper authentication
 * and authorization checks.
 */

/**
 * Get event invite management data (all invites for an event)
 * Used by invite management pages
 */
export const getEventInvites = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require organizer or moderator role to manage invites
    await requireEventRole(ctx, eventId, 'MODERATOR');

    // Get the event
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all invites for this event
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('desc')
      .collect();

    // Return invites with Convex types
    return {
      invites,
      userRole: 'ORGANIZER' as const, // Will be determined by auth check
    };
  },
});

/**
 * Get invite by token (for public invite acceptance)
 * Returns null if invite is not found, expired, or has no uses remaining
 * This allows the client to show a user-friendly error message
 */
export const getInviteByToken = query({
  args: {
    token: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { token }) => {
    // Get invite by token
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    // Return null for invalid invites so the client can show a friendly error
    if (!invite) {
      return null;
    }

    // Check if invite is valid (not expired and has uses remaining)
    const now = Date.now();

    if (invite.expiresAt && invite.expiresAt <= now) {
      return null; // Expired
    }

    if (invite.usesRemaining !== undefined && invite.usesRemaining <= 0) {
      return null; // No uses remaining
    }

    // Get event details
    const event = await ctx.db.get(invite.eventId);
    if (!event) {
      return null; // Event was deleted
    }

    return {
      invite: {
        id: invite._id,
        eventId: invite.eventId,
        name: invite.name || null,
        usesRemaining: invite.usesRemaining,
        usesTotal: invite.usesTotal,
        expiresAt: invite.expiresAt ?? null,
        token: invite.token,
      },
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime ?? null,
        chosenEndDateTime: event.chosenEndDateTime ?? null,
      },
    };
  },
});

import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';
import { Doc, Id } from '../_generated/dataModel';

/**
 * Type for invite creation data
 */
type InviteCreateData = {
  eventId: Id<'events'>;
  token: string;
  createdById: Id<'memberships'>;
  name?: string;
  usesTotal?: number;
  usesRemaining?: number;
  expiresAt?: number;
};

/**
 * Invites mutations for the Convex backend
 *
 * These functions handle invite creation, updates, deletion, and usage
 * with proper authentication and authorization checks.
 */

/**
 * Create a new invite for an event
 */
export const createInvite = mutation({
  args: {
    eventId: v.id('events'),
    name: v.optional(v.string()),
    usesTotal: v.optional(v.number()),
    expiresAt: v.optional(v.number()), // Unix timestamp
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, name, usesTotal, expiresAt }) => {
    // Require organizer or moderator role and get the membership
    const membership = await requireEventRole(ctx, eventId, 'MODERATOR');

    // Generate unique invite token
    const token = generateInviteToken();

    // Build the invite object with proper optional field handling
    const now = Date.now();
    const inviteData: InviteCreateData & { updatedAt: number } = {
      eventId: eventId,
      token: token,
      createdById: membership._id, // Use membership ID, not person ID
      updatedAt: now,
    };

    // Only include optional fields if they have actual values
    if (name) inviteData.name = name;
    if (usesTotal !== undefined) {
      inviteData.usesTotal = usesTotal;
      inviteData.usesRemaining = usesTotal;
    }
    if (expiresAt !== undefined) inviteData.expiresAt = expiresAt;

    // Create the invite
    const inviteId = await ctx.db.insert('invites', inviteData);

    // Get the created invite
    const invite = await ctx.db.get(inviteId);

    return {
      invite: {
        id: invite!._id,
        eventId: invite!.eventId,
        name: invite!.name,
        token: invite!.token,
        usesTotal: invite!.usesTotal,
        usesRemaining: invite!.usesRemaining,
        expiresAt: invite!.expiresAt ?? null,
        createdAt: invite!._creationTime,
        createdById: invite!.createdById,
      },
    };
  },
});

/**
 * Update an existing invite
 */
export const updateInvite = mutation({
  args: {
    inviteId: v.id('invites'),
    name: v.optional(v.string()),
    usesTotal: v.optional(v.number()),
    expiresAt: v.optional(v.number()), // Unix timestamp
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { inviteId, name, usesTotal, expiresAt }) => {
    // Get the invite
    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }

    // Require organizer or moderator role for the event
    await requireEventRole(ctx, invite.eventId, 'MODERATOR');

    // Calculate new usesRemaining if usesTotal changed
    let newUsesRemaining = invite.usesRemaining;
    if (usesTotal !== undefined) {
      if (
        invite.usesTotal !== undefined &&
        invite.usesRemaining !== undefined
      ) {
        // Calculate how many uses have been consumed
        const usesConsumed = invite.usesTotal - invite.usesRemaining;
        newUsesRemaining = Math.max(0, usesTotal - usesConsumed);
      } else {
        newUsesRemaining = usesTotal || undefined;
      }
    }

    // Build update object with proper optional field handling
    const updateData: Partial<Doc<'invites'>> = {
      usesRemaining: newUsesRemaining,
      updatedAt: Date.now(),
    };

    // Only include fields that are being updated
    if (name !== undefined) {
      if (name) {
        updateData.name = name;
      } else {
        // Remove the field if setting to empty
        updateData.name = undefined;
      }
    }

    if (usesTotal !== undefined) {
      if (usesTotal !== null) {
        updateData.usesTotal = usesTotal;
      } else {
        updateData.usesTotal = undefined;
      }
    }

    if (expiresAt !== undefined) {
      if (expiresAt !== null) {
        updateData.expiresAt = expiresAt;
      } else {
        updateData.expiresAt = undefined;
      }
    }

    // Update the invite
    await ctx.db.patch(inviteId, updateData);

    // Get the updated invite
    const updatedInvite = await ctx.db.get(inviteId);

    return {
      invite: {
        id: updatedInvite!._id,
        eventId: updatedInvite!.eventId,
        name: updatedInvite!.name,
        token: updatedInvite!.token,
        usesTotal: updatedInvite!.usesTotal,
        usesRemaining: updatedInvite!.usesRemaining,
        expiresAt: updatedInvite!.expiresAt ?? null,
        createdAt: updatedInvite!._creationTime,
        createdById: updatedInvite!.createdById,
      },
    };
  },
});

/**
 * Delete invites (can delete multiple at once)
 */
export const deleteInvites = mutation({
  args: {
    inviteIds: v.array(v.id('invites')),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { inviteIds }) => {
    // Verify all invites exist and user has permission
    const invites = await Promise.all(inviteIds.map(id => ctx.db.get(id)));

    const validInvites = invites.filter(invite => invite !== null);
    if (validInvites.length === 0) {
      throw new Error('No valid invites found');
    }

    // Check permissions for all events (invites might be from different events)
    const eventIds = [...new Set(validInvites.map(invite => invite!.eventId))];
    for (const eventId of eventIds) {
      await requireEventRole(ctx, eventId, 'MODERATOR');
    }

    // Delete all valid invites
    for (const invite of validInvites) {
      await ctx.db.delete(invite!._id);
    }

    return {
      deletedCount: validInvites.length,
      deletedIds: validInvites.map(invite => invite!._id),
    };
  },
});

/**
 * Accept an invite and join the event
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { token }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get invite by token
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    if (!invite) {
      throw new Error('Invite not found');
    }

    // Check if invite is valid
    const now = Date.now();

    if (invite.expiresAt && invite.expiresAt <= now) {
      throw new Error('Invite has expired');
    }

    if (invite.usesRemaining !== undefined && invite.usesRemaining <= 0) {
      throw new Error('Invite has no uses remaining');
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', invite.eventId)
      )
      .first();

    if (existingMembership) {
      throw new Error('You are already a member of this event');
    }

    // Check if user is banned from this event
    const ban = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', invite.eventId)
      )
      .first();

    if (ban) {
      throw new Error('You have been banned from this event');
    }

    // Create membership
    const membershipId = await ctx.db.insert('memberships', {
      personId: person._id,
      eventId: invite.eventId,
      role: 'ATTENDEE',
      rsvpStatus: 'PENDING',
      updatedAt: now,
    });

    // Decrement invite uses if limited
    if (invite.usesRemaining !== undefined) {
      await ctx.db.patch(invite._id, {
        usesRemaining: invite.usesRemaining - 1,
        updatedAt: Date.now(),
      });
    }

    // Get the created membership
    const membership = await ctx.db.get(membershipId);

    // Get the event
    const event = await ctx.db.get(invite.eventId);

    return {
      membership: {
        id: membership!._id,
        eventId: membership!.eventId,
        role: membership!.role,
        rsvpStatus: membership!.rsvpStatus,
      },
      event: {
        id: event!._id,
        title: event!.title,
        description: event!.description,
        location: event!.location,
      },
    };
  },
});

/**
 * Generate a unique invite token
 */
function generateInviteToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

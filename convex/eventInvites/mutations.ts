import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth } from '../auth';
import { createNotification } from '../lib/notifications';
import { checkCanSendEventInvite } from '../lib/privacy';

/**
 * Event Invites mutations for the Convex backend
 *
 * These functions handle internal event invite operations between users.
 */

/**
 * Send an event invite to another user
 */
export const sendEventInvite = mutation({
  args: {
    eventId: v.id('events'),
    inviteePersonId: v.id('persons'),
    role: v.union(v.literal('ATTENDEE'), v.literal('MODERATOR')),
    message: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, inviteePersonId, role, message }) => {
    const { person } = await requireAuth(ctx);

    // Can't invite yourself
    if (person._id === inviteePersonId) {
      throw new ConvexError("You can't invite yourself to an event");
    }

    // Check if event exists
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new ConvexError('Event not found');
    }

    // Check if inviter is a member of the event
    const inviterMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!inviterMembership) {
      throw new ConvexError(
        'You must be a member of this event to invite others'
      );
    }

    // Only organizers can invite as moderator
    if (role === 'MODERATOR' && inviterMembership.role !== 'ORGANIZER') {
      throw new ConvexError(
        'Only organizers can invite someone as a moderator'
      );
    }

    // Check if invitee exists
    const invitee = await ctx.db.get(inviteePersonId);
    if (!invitee) {
      throw new ConvexError('User not found');
    }

    // Check privacy settings
    const privacyCheck = await checkCanSendEventInvite(
      ctx,
      person._id,
      inviteePersonId
    );
    if (!privacyCheck.allowed) {
      throw new ConvexError(
        privacyCheck.reason || 'This user is not accepting event invites'
      );
    }

    // Check if invitee is already a member
    const existingMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', inviteePersonId).eq('eventId', eventId)
      )
      .first();

    if (existingMembership) {
      throw new ConvexError('This user is already a member of the event');
    }

    // Check if invitee is banned from the event
    const isBanned = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', inviteePersonId).eq('eventId', eventId)
      )
      .first();

    if (isBanned) {
      throw new ConvexError('This user is banned from the event');
    }

    // Check if there's already a pending invite
    const existingInvite = await ctx.db
      .query('eventInvites')
      .withIndex('by_event_invitee', q =>
        q.eq('eventId', eventId).eq('inviteeId', inviteePersonId)
      )
      .first();

    if (existingInvite) {
      if (existingInvite.status === 'PENDING') {
        throw new ConvexError('An invite has already been sent to this user');
      }
      // If previously declined, allow re-inviting by deleting old invite
      await ctx.db.delete(existingInvite._id);
    }

    // Create the invite
    const inviteId = await ctx.db.insert('eventInvites', {
      eventId,
      inviterId: person._id,
      inviteeId: inviteePersonId,
      status: 'PENDING',
      role,
      message,
      createdAt: Date.now(),
    });

    // Notify the invitee
    await createNotification(ctx, {
      personId: inviteePersonId,
      type: 'EVENT_INVITE_RECEIVED',
      authorId: person._id,
      eventId,
    });

    return {
      inviteId,
      status: 'PENDING' as const,
      message: 'Invite sent successfully',
    };
  },
});

/**
 * Accept an event invite
 */
export const acceptEventInvite = mutation({
  args: {
    inviteId: v.id('eventInvites'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { inviteId }) => {
    const { person } = await requireAuth(ctx);

    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw new ConvexError('Invite not found');
    }

    // Only the invitee can accept
    if (invite.inviteeId !== person._id) {
      throw new ConvexError("You can't accept this invite");
    }

    if (invite.status !== 'PENDING') {
      throw new ConvexError('This invite has already been processed');
    }

    // Check event still exists
    const event = await ctx.db.get(invite.eventId);
    if (!event) {
      throw new ConvexError('Event no longer exists');
    }

    // Check if user is banned
    const isBanned = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', invite.eventId)
      )
      .first();

    if (isBanned) {
      throw new ConvexError('You are banned from this event');
    }

    // Check if already a member (shouldn't happen, but be safe)
    const existingMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', invite.eventId)
      )
      .first();

    if (existingMembership) {
      // Already a member - just update invite status
      await ctx.db.patch(inviteId, {
        status: 'ACCEPTED',
        respondedAt: Date.now(),
      });

      return {
        success: true,
        membershipId: existingMembership._id,
        message: 'You are already a member of this event',
      };
    }

    // Update invite status
    await ctx.db.patch(inviteId, {
      status: 'ACCEPTED',
      respondedAt: Date.now(),
    });

    // Create membership
    const membershipId = await ctx.db.insert('memberships', {
      personId: person._id,
      eventId: invite.eventId,
      role: invite.role,
      rsvpStatus: 'PENDING',
      updatedAt: Date.now(),
    });

    // Remove any other pending invites for this event
    const otherPendingInvites = await ctx.db
      .query('eventInvites')
      .withIndex('by_event_invitee', q =>
        q.eq('eventId', invite.eventId).eq('inviteeId', person._id)
      )
      .filter(q =>
        q.and(
          q.eq(q.field('status'), 'PENDING'),
          q.neq(q.field('_id'), inviteId)
        )
      )
      .collect();

    // Delete other pending invites since user has now joined
    for (const otherInvite of otherPendingInvites) {
      await ctx.db.delete(otherInvite._id);
    }

    // Notify the inviter that their invite was accepted
    await createNotification(ctx, {
      personId: invite.inviterId,
      type: 'EVENT_INVITE_ACCEPTED',
      authorId: person._id,
      eventId: invite.eventId,
    });

    return {
      success: true,
      membershipId,
      message: 'Invite accepted',
    };
  },
});

/**
 * Decline an event invite
 */
export const declineEventInvite = mutation({
  args: {
    inviteId: v.id('eventInvites'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { inviteId }) => {
    const { person } = await requireAuth(ctx);

    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw new ConvexError('Invite not found');
    }

    // Only the invitee can decline
    if (invite.inviteeId !== person._id) {
      throw new ConvexError("You can't decline this invite");
    }

    if (invite.status !== 'PENDING') {
      throw new ConvexError('This invite has already been processed');
    }

    // Update to declined
    await ctx.db.patch(inviteId, {
      status: 'DECLINED',
      respondedAt: Date.now(),
    });

    return {
      success: true,
      message: 'Invite declined',
    };
  },
});

/**
 * Cancel a sent event invite
 */
export const cancelEventInvite = mutation({
  args: {
    inviteId: v.id('eventInvites'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { inviteId }) => {
    const { person } = await requireAuth(ctx);

    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw new ConvexError('Invite not found');
    }

    // Check if user is the inviter or has moderator/organizer role on the event
    const isInviter = invite.inviterId === person._id;

    if (!isInviter) {
      // Check if user is organizer/moderator
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', person._id).eq('eventId', invite.eventId)
        )
        .first();

      if (
        !membership ||
        (membership.role !== 'ORGANIZER' && membership.role !== 'MODERATOR')
      ) {
        throw new ConvexError("You can't cancel this invite");
      }
    }

    if (invite.status !== 'PENDING') {
      throw new ConvexError('This invite has already been processed');
    }

    // Delete the invite
    await ctx.db.delete(inviteId);

    return {
      success: true,
      message: 'Invite cancelled',
    };
  },
});

import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';

/**
 * Internal queries and mutations for invite routes
 */

export const listEventInvites = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();

    return {
      invites: invites.map(invite => ({
        id: invite._id,
        eventId: invite.eventId,
        token: invite.token,
        name: invite.name ?? null,
        maxUses: invite.maxUses ?? null,
        usesTotal: invite.usesTotal ?? null,
        usesRemaining: invite.usesRemaining ?? null,
        expiresAt: invite.expiresAt ?? null,
        createdAt: invite._creationTime,
      })),
    };
  },
});

export const createInvite = internalMutation({
  args: {
    eventId: v.string(),
    creatorMembershipId: v.string(),
    maxUses: v.optional(v.number()),
    name: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { eventId, creatorMembershipId, maxUses, name, expiresAt }
  ) => {
    const token = crypto.randomUUID();
    const now = Date.now();

    const inviteId = await ctx.db.insert('invites', {
      eventId: eventId as Id<'events'>,
      createdById: creatorMembershipId as Id<'memberships'>,
      token,
      maxUses,
      usesRemaining: maxUses,
      usesTotal: 0,
      name: name?.trim(),
      expiresAt,
      updatedAt: now,
    });

    return {
      id: inviteId,
      token,
    };
  },
});

export const deleteInvite = internalMutation({
  args: {
    inviteId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { inviteId, personId }) => {
    const invite = await ctx.db.get(inviteId as Id<'invites'>);
    if (!invite) {
      throw new Error('Invite not found');
    }

    // Verify the person is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', invite.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('Not a member of this event');
    }

    await ctx.db.delete(inviteId as Id<'invites'>);

    return { success: true };
  },
});

export const getInviteByToken = internalQuery({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    if (!invite) {
      return null;
    }

    // Get event info for public display
    const event = await ctx.db.get(invite.eventId);

    const expired = invite.expiresAt ? invite.expiresAt < Date.now() : false;
    const maxUsesReached =
      invite.maxUses !== undefined &&
      invite.usesTotal !== undefined &&
      invite.usesTotal >= invite.maxUses;

    return {
      id: invite._id,
      eventTitle: event?.title ?? 'Unknown Event',
      eventDescription: event?.description ?? null,
      eventLocation: event?.location ?? null,
      eventId: invite.eventId,
      name: invite.name ?? null,
      expired,
      maxUsesReached: maxUsesReached ?? false,
    };
  },
});

export const acceptInvite = internalMutation({
  args: {
    token: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { token, personId }) => {
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    if (!invite) {
      throw new Error('Invite not found');
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error('Invite has expired');
    }

    // Check if max uses reached
    if (
      invite.maxUses !== undefined &&
      invite.usesTotal !== undefined &&
      invite.usesTotal >= invite.maxUses
    ) {
      throw new Error('Invite has reached maximum uses');
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', invite.eventId)
      )
      .first();

    if (existingMembership) {
      throw new Error('Already a member of this event');
    }

    const now = Date.now();

    // Create membership
    const membershipId = await ctx.db.insert('memberships', {
      personId: personId as Id<'persons'>,
      eventId: invite.eventId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
      updatedAt: now,
    });

    // Update invite usage
    await ctx.db.patch(invite._id, {
      usesTotal: (invite.usesTotal ?? 0) + 1,
      usesRemaining:
        invite.usesRemaining !== undefined
          ? invite.usesRemaining - 1
          : undefined,
      updatedAt: now,
    });

    // Increment event member count
    const event = await ctx.db.get(invite.eventId);
    if (event) {
      await ctx.db.patch(invite.eventId, {
        memberCount: (event.memberCount ?? 0) + 1,
        updatedAt: now,
      });
    }

    return {
      eventId: invite.eventId,
      membershipId,
    };
  },
});

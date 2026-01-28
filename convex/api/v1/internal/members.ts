import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { getPersonWithUser } from '../../../auth';

/**
 * Internal queries and mutations for member routes
 */

export const listEventMembers = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();

    const membersWithUsers = await Promise.all(
      memberships.map(async membership => {
        const memberData = await getPersonWithUser(ctx, membership.personId);
        return {
          id: membership._id,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
          joinedAt: membership._creationTime,
          personId: membership.personId,
          user: memberData
            ? {
                id: memberData.user._id,
                name: memberData.user.name ?? null,
                email: memberData.user.email ?? null,
                image: memberData.user.image ?? null,
                username: memberData.user.username ?? null,
              }
            : null,
        };
      })
    );

    return {
      members: membersWithUsers.filter(m => m.user !== null),
    };
  },
});

export const updateMemberRole = internalMutation({
  args: {
    membershipId: v.string(),
    newRole: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
  },
  handler: async (ctx, { membershipId, newRole }) => {
    const membership = await ctx.db.get(membershipId as Id<'memberships'>);
    if (!membership) {
      throw new Error('Membership not found');
    }

    // Prevent demoting last organizer
    if (membership.role === 'ORGANIZER' && newRole !== 'ORGANIZER') {
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', membership.eventId))
        .collect()
        .then(members => members.filter(m => m.role === 'ORGANIZER').length);

      if (organizerCount <= 1) {
        throw new Error('Cannot demote the last organizer');
      }
    }

    await ctx.db.patch(membershipId as Id<'memberships'>, {
      role: newRole,
      updatedAt: Date.now(),
    });

    const updatedMembership = await ctx.db.get(
      membershipId as Id<'memberships'>
    );
    const memberData = updatedMembership
      ? await getPersonWithUser(ctx, updatedMembership.personId)
      : null;

    return {
      id: updatedMembership!._id,
      role: updatedMembership!.role,
      rsvpStatus: updatedMembership!.rsvpStatus,
      joinedAt: updatedMembership!._creationTime,
      personId: updatedMembership!.personId,
      user: memberData
        ? {
            id: memberData.user._id,
            name: memberData.user.name ?? null,
            email: memberData.user.email ?? null,
            image: memberData.user.image ?? null,
            username: memberData.user.username ?? null,
          }
        : null,
    };
  },
});

export const removeMember = internalMutation({
  args: {
    membershipId: v.string(),
  },
  handler: async (ctx, { membershipId }) => {
    const membership = await ctx.db.get(membershipId as Id<'memberships'>);
    if (!membership) {
      throw new Error('Membership not found');
    }

    // Prevent removing last organizer
    if (membership.role === 'ORGANIZER') {
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', membership.eventId))
        .collect()
        .then(members => members.filter(m => m.role === 'ORGANIZER').length);

      if (organizerCount <= 1) {
        throw new Error('Cannot remove the last organizer');
      }
    }

    // Delete availabilities
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q =>
        q.eq('membershipId', membershipId as Id<'memberships'>)
      )
      .collect();

    for (const avail of availabilities) {
      await ctx.db.delete(avail._id);
    }

    // Delete membership
    await ctx.db.delete(membershipId as Id<'memberships'>);

    return { success: true };
  },
});

export const leaveEvent = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { eventId, personId }) => {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', eventId as Id<'events'>)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Prevent last organizer from leaving
    if (membership.role === 'ORGANIZER') {
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
        .collect()
        .then(members => members.filter(m => m.role === 'ORGANIZER').length);

      if (organizerCount <= 1) {
        throw new Error(
          'Cannot leave event as the last organizer. Transfer ownership first.'
        );
      }
    }

    // Delete availabilities
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q => q.eq('membershipId', membership._id))
      .collect();

    for (const avail of availabilities) {
      await ctx.db.delete(avail._id);
    }

    // Delete membership
    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

export const updateRsvp = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    rsvpStatus: v.union(
      v.literal('YES'),
      v.literal('MAYBE'),
      v.literal('NO'),
      v.literal('PENDING')
    ),
  },
  handler: async (ctx, { eventId, personId, rsvpStatus }) => {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', eventId as Id<'events'>)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    await ctx.db.patch(membership._id, {
      rsvpStatus,
      updatedAt: Date.now(),
    });

    return {
      membershipId: membership._id,
      rsvpStatus,
    };
  },
});

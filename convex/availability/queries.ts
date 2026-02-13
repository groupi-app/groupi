import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, getPersonWithUser } from '../auth';

/**
 * Availability queries for the Convex backend
 *
 * These functions handle availability and date voting data retrieval
 * with proper authentication and authorization checks.
 */

/**
 * Get availability data for an event (used by availability pages)
 * Returns event, potential dates, and all availability responses
 */
export const getEventAvailabilityData = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require authentication and membership
    const { person: currentPerson } = await requireAuth(ctx);

    const userMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!userMembership) {
      throw new Error('You are not a member of this event');
    }

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all potential date times
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect();

    // Get all memberships for this event
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    // Get user data for each member
    const membersWithUsers = await Promise.all(
      memberships.map(async membership => {
        const memberData = await getPersonWithUser(ctx, membership.personId);
        return {
          ...membership,
          person: memberData?.person || null,
          user: memberData?.user || null,
        };
      })
    );

    const validMembers = membersWithUsers.filter(m => m.person && m.user);

    // Determine if current user can see private notes (organizer/moderator)
    const canSeeAllNotes =
      userMembership.role === 'ORGANIZER' ||
      userMembership.role === 'MODERATOR';

    // Build a membership lookup map for efficient member resolution
    const membershipMap = new Map(validMembers.map(m => [m._id, m]));

    // Query availabilities per potential date time using the by_potential_date index
    // (avoids full table scan that would exceed read limits in production)
    const potentialDateTimes = await Promise.all(
      potentialDates.map(async date => {
        const dateAvailabilities = await ctx.db
          .query('availabilities')
          .withIndex('by_potential_date', q =>
            q.eq('potentialDateTimeId', date._id)
          )
          .collect();

        const availabilities = dateAvailabilities
          .map(avail => {
            const member = membershipMap.get(avail.membershipId);
            if (!member) return null;

            // Availability notes are visible to the author + organizers/moderators
            const isAuthor = member.personId === currentPerson._id;
            const visibleNote =
              isAuthor || canSeeAllNotes ? avail.note : undefined;

            return {
              ...avail,
              note: visibleNote,
              member: {
                ...member,
                person: member.person
                  ? {
                      ...member.person,
                      user: member.user!,
                    }
                  : null,
              },
            };
          })
          .filter((a): a is NonNullable<typeof a> => a !== null);

        return {
          ...date,
          // potentialDateTime notes are visible to all members (no filtering needed)
          availabilities,
        };
      })
    );

    return {
      potentialDateTimes,
      userRole: userMembership.role,
      userId: currentPerson._id,
    };
  },
});

/**
 * Get potential date times for an event (simpler version)
 */
export const getEventPotentialDates = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Verify access to event
    const { person: currentPerson } = await requireAuth(ctx);

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('Access denied to this event');
    }

    // Get all potential date times for this event
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect();

    return potentialDates.map(date => ({
      id: date._id,
      eventId: date.eventId,
      dateTime: date.dateTime,
    }));
  },
});

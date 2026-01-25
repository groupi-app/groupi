import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson, requireAuth, getPersonWithUser } from '../auth';

/**
 * Events queries for the Convex backend
 *
 * These functions handle event data retrieval with proper authentication
 * and authorization checks.
 */

/**
 * Get event header data with user membership
 * Used by event pages for basic event information
 */
export const getEventHeader = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require authentication
    const { person: currentPerson } = await requireAuth(ctx);

    // Get the event
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user is a member of the event
    const userMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!userMembership) {
      throw new Error('You are not a member of this event');
    }

    // Get image URL if event has an image
    const imageUrl = event.imageStorageId
      ? await ctx.storage.getUrl(event.imageStorageId)
      : null;

    return {
      event: {
        ...event,
        imageUrl,
        chosenDateTime: event.chosenDateTime,
      },
      userMembership: {
        ...userMembership,
        person: currentPerson,
      },
    };
  },
});

/**
 * Get event attendees/members data
 * Used by attendees pages and member lists
 */
export const getEventAttendeesData = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require authentication
    const { person: currentPerson } = await requireAuth(ctx);

    // Get the event
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user is a member of the event
    const userMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!userMembership) {
      throw new Error('You are not a member of this event');
    }

    // Get all event memberships
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    // Get user data for all members and their availabilities
    const membershipsWithData = await Promise.all(
      memberships.map(async membership => {
        const memberData = await getPersonWithUser(ctx, membership.personId);

        // Get availabilities for this member
        const availabilities = await ctx.db
          .query('availabilities')
          .withIndex('by_membership', q => q.eq('membershipId', membership._id))
          .collect();

        // Get potential date time data for each availability
        const availabilitiesWithDates = await Promise.all(
          availabilities.map(async availability => {
            const potentialDateTime = await ctx.db.get(
              availability.potentialDateTimeId
            );
            return {
              ...availability,
              potentialDateTime,
            };
          })
        );

        return {
          ...membership,
          person: memberData
            ? {
                ...memberData.person,
                user: memberData.user,
              }
            : null,
          user: memberData?.user || null,
          availabilities: availabilitiesWithDates,
        };
      })
    );

    // Filter out invalid memberships
    const validMemberships = membershipsWithData.filter(
      m => m.person && m.person.user
    );

    return {
      event: {
        ...event,
        memberships: validMemberships,
        chosenDateTime: event.chosenDateTime,
      },
      userMembership: {
        ...userMembership,
        role: userMembership.role,
      },
      userId: currentPerson._id,
    };
  },
});

/**
 * Get events for the current user (dashboard)
 * Used by user dashboard and event lists
 */
export const getUserEvents = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    // Require authentication
    const { person: currentPerson } = await requireAuth(ctx);

    // Get all memberships for this user
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();

    // Get event data for each membership
    const eventsWithMemberships = await Promise.all(
      memberships.map(async membership => {
        const event = await ctx.db.get(membership.eventId);
        if (!event) return null;

        // Get member count for this event
        const memberCount = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect()
          .then(members => members.length);

        // Get the organizer (creator) data
        const organizerData = await getPersonWithUser(ctx, event.creatorId);

        // Get image URL if event has an image
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          event: {
            ...event,
            imageUrl,
            chosenDateTime: event.chosenDateTime,
            memberCount,
          },
          membership: {
            ...membership,
            role: membership.role,
            rsvpStatus: membership.rsvpStatus,
          },
          organizer: organizerData
            ? {
                person: organizerData.person,
                user: organizerData.user,
              }
            : null,
        };
      })
    );

    // Filter out null events and sort by creation date
    const validEvents = eventsWithMemberships
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.event._creationTime - a.event._creationTime);

    return {
      events: validEvents,
      userId: currentPerson._id,
    };
  },
});

/**
 * Get single event by ID (basic info)
 * Used for quick lookups and validations
 */
export const getEvent = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if current user has access to this event
    const currentPerson = await getCurrentPerson(ctx);
    if (currentPerson) {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', currentPerson._id).eq('eventId', eventId)
        )
        .first();

      if (!membership) {
        throw new Error('Access denied to this event');
      }
    }

    // Get image URL if event has an image
    const imageUrl = event.imageStorageId
      ? await ctx.storage.getUrl(event.imageStorageId)
      : null;

    return {
      ...event,
      imageUrl,
    };
  },
});

/**
 * Get potential date times for an event
 * Used by availability/voting components
 */
export const getEventPotentialDates = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Verify access to event
    const currentPerson = await getCurrentPerson(ctx);
    if (currentPerson) {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', currentPerson._id).eq('eventId', eventId)
        )
        .first();

      if (!membership) {
        throw new Error('Access denied to this event');
      }
    }

    // Get all potential date times for this event
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect();

    return potentialDates;
  },
});

/**
 * Get event availability data (for availability pages)
 * Returns event, members, potential dates, and all availability responses
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

    // Get all memberships
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    // Get user data for each member - nest user inside person AND at top level for compatibility
    const membersWithUsers = await Promise.all(
      memberships.map(async membership => {
        const memberData = await getPersonWithUser(ctx, membership.personId);
        return {
          ...membership,
          person: memberData
            ? {
                ...memberData.person,
                user: memberData.user,
              }
            : null,
          user: memberData?.user || null,
        };
      })
    );

    const validMembers = membersWithUsers.filter(
      m => m.person && m.person.user
    );

    // Get all availabilities for this event
    const allAvailabilities = await ctx.db.query('availabilities').collect();

    // Filter availabilities for this event's memberships
    const membershipIds = validMembers.map(m => m._id);
    const eventAvailabilities = allAvailabilities.filter(availability =>
      membershipIds.includes(availability.membershipId)
    );

    // Group availabilities by potential date time
    const availabilitiesByDate = potentialDates.map(date => {
      const dateAvailabilities = eventAvailabilities.filter(
        avail => avail.potentialDateTimeId === date._id
      );

      return {
        potentialDateTime: date,
        availabilities: dateAvailabilities
          .map(avail => {
            const member = validMembers.find(m => m._id === avail.membershipId);
            return {
              ...avail,
              member: member || null,
            };
          })
          .filter(a => a.member !== null),
      };
    });

    return {
      event: {
        ...event,
        chosenDateTime: event.chosenDateTime,
      },
      members: validMembers,
      potentialDates: availabilitiesByDate,
      userMembership: {
        ...userMembership,
        person: currentPerson,
      },
    };
  },
});

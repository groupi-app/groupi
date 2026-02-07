import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson, requireAuth, getPersonWithUser } from '../auth';
import { checkCanSendEventInvite } from '../lib/privacy';

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
        // rsvpNote is always visible to the current user for their own membership
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

    // Determine if current user can see private rsvpNotes (organizer/moderator)
    const canSeeAllRsvpNotes =
      userMembership.role === 'ORGANIZER' ||
      userMembership.role === 'MODERATOR';

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

        // rsvpNote is visible to the author + organizers/moderators
        const isOwnMembership = membership.personId === currentPerson._id;
        const visibleRsvpNote =
          isOwnMembership || canSeeAllRsvpNotes
            ? membership.rsvpNote
            : undefined;

        return {
          ...membership,
          rsvpNote: visibleRsvpNote,
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

    // Determine if current user can see private notes (organizer/moderator)
    const canSeeAllNotes =
      userMembership.role === 'ORGANIZER' ||
      userMembership.role === 'MODERATOR';

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
            // Availability notes are visible to the author + organizers/moderators
            const isAuthor = member?.personId === currentPerson._id;
            const visibleNote =
              isAuthor || canSeeAllNotes ? avail.note : undefined;
            return {
              ...avail,
              note: visibleNote,
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

/**
 * Get user's events and pending invites in a single query
 * Combines getUserEvents with pending event invites for seamless tab switching
 */
export const getUserEventsAndInvites = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    // Require authentication
    const { person: currentPerson } = await requireAuth(ctx);

    // ===== FETCH EVENTS (same as getUserEvents) =====
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();

    const eventsWithMemberships = await Promise.all(
      memberships.map(async membership => {
        const event = await ctx.db.get(membership.eventId);
        if (!event) return null;

        const memberCount = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect()
          .then(members => members.length);

        const organizerData = await getPersonWithUser(ctx, event.creatorId);

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

    const validEvents = eventsWithMemberships
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.event._creationTime - a.event._creationTime);

    // ===== FETCH PENDING INVITES =====
    const pendingInvites = await ctx.db
      .query('eventInvites')
      .withIndex('by_invitee_status', q =>
        q.eq('inviteeId', currentPerson._id).eq('status', 'PENDING')
      )
      .collect();

    const invites = await Promise.all(
      pendingInvites.map(async invite => {
        const event = await ctx.db.get(invite.eventId);
        if (!event) return null;

        const inviterPerson = await ctx.db.get(invite.inviterId);
        if (!inviterPerson) return null;

        const inviterData = await getPersonWithUser(ctx, inviterPerson._id);

        let eventImageUrl: string | null = null;
        if (event.imageStorageId) {
          eventImageUrl = await ctx.storage.getUrl(event.imageStorageId);
        }

        const eventMemberships = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect();

        return {
          inviteId: invite._id,
          eventId: event._id,
          eventTitle: event.title,
          eventDescription: event.description || null,
          eventImageUrl,
          eventLocation: event.location || null,
          eventDateTime: event.chosenDateTime || null,
          eventVisibility: event.visibility || 'PRIVATE',
          memberCount: eventMemberships.length,
          role: invite.role,
          message: invite.message || null,
          createdAt: invite.createdAt,
          inviter: {
            personId: inviterPerson._id,
            name: inviterData?.user?.name || null,
            username: inviterData?.user?.username || null,
            image: inviterData?.user?.image || null,
          },
        };
      })
    );

    const validInvites = invites.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    return {
      events: validEvents,
      pendingInvites: validInvites,
      pendingInviteCount: validInvites.length,
      userId: currentPerson._id,
    };
  },
});

/**
 * Get events the current user can invite a target user to.
 * Returns events where:
 * - Current user is a member
 * - Target user is NOT a member, NOT banned, and does NOT have a pending invite
 * Also checks privacy: if target's settings block invites, returns empty array.
 */
export const getEventsForUserInvite = query({
  args: {
    targetPersonId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { targetPersonId }) => {
    const { person: currentPerson } = await requireAuth(ctx);

    // Check privacy first
    const privacyCheck = await checkCanSendEventInvite(
      ctx,
      currentPerson._id,
      targetPersonId
    );
    if (!privacyCheck.allowed) {
      return [];
    }

    // Get current user's memberships
    const myMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();

    // Get target user's memberships
    const targetMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', targetPersonId))
      .collect();
    const targetEventIds = new Set(targetMemberships.map(m => m.eventId));

    // Get target user's bans
    const targetBans = await ctx.db
      .query('eventBans')
      .withIndex('by_person', q => q.eq('personId', targetPersonId))
      .collect();
    const bannedEventIds = new Set(targetBans.map(b => b.eventId));

    // Get target user's pending invites
    const targetPendingInvites = await ctx.db
      .query('eventInvites')
      .withIndex('by_invitee_status', q =>
        q.eq('inviteeId', targetPersonId).eq('status', 'PENDING')
      )
      .collect();
    const pendingInviteEventIds = new Set(
      targetPendingInvites.map(i => i.eventId)
    );

    // Filter to eligible events
    const eligibleEvents = [];
    for (const membership of myMemberships) {
      const eventId = membership.eventId;

      // Skip if target is already a member, banned, or has pending invite
      if (targetEventIds.has(eventId)) continue;
      if (bannedEventIds.has(eventId)) continue;
      if (pendingInviteEventIds.has(eventId)) continue;

      const event = await ctx.db.get(eventId);
      if (!event) continue;

      // Skip past events (chosenDateTime is set and in the past)
      if (event.chosenDateTime && event.chosenDateTime < Date.now()) continue;

      // Get member count
      const memberCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect()
        .then(members => members.length);

      // Get image URL
      const eventImageUrl = event.imageStorageId
        ? await ctx.storage.getUrl(event.imageStorageId)
        : null;

      eligibleEvents.push({
        eventId: event._id,
        title: event.title,
        location: event.location || null,
        chosenDateTime: event.chosenDateTime || null,
        memberCount,
        eventImageUrl,
        currentUserRole: membership.role,
      });
    }

    return eligibleEvents;
  },
});

/**
 * Get discoverable events from friends
 * Returns upcoming events with visibility 'FRIENDS' created by the user's friends,
 * where the user is NOT already a member.
 */
export const getDiscoverableEvents = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const { person: currentPerson } = await requireAuth(ctx);

    // Get all accepted friendships (same pattern as getFriends)
    const asRequester = await ctx.db
      .query('friendships')
      .withIndex('by_requester', q => q.eq('requesterId', currentPerson._id))
      .collect();
    const asAddressee = await ctx.db
      .query('friendships')
      .withIndex('by_addressee', q => q.eq('addresseeId', currentPerson._id))
      .collect();

    const acceptedAsRequester = asRequester.filter(
      f => f.status === 'ACCEPTED'
    );
    const acceptedAsAddressee = asAddressee.filter(
      f => f.status === 'ACCEPTED'
    );

    const friendPersonIds = [
      ...acceptedAsRequester.map(f => f.addresseeId),
      ...acceptedAsAddressee.map(f => f.requesterId),
    ];

    if (friendPersonIds.length === 0) {
      return [];
    }

    // Get current user's existing memberships to filter them out
    const myMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();
    const myEventIds = new Set(myMemberships.map(m => m.eventId));

    const now = Date.now();
    const discoverableEvents = [];

    // For each friend, find their events with FRIENDS visibility
    for (const friendPersonId of friendPersonIds) {
      const friendEvents = await ctx.db
        .query('events')
        .withIndex('by_creator', q => q.eq('creatorId', friendPersonId))
        .collect();

      for (const event of friendEvents) {
        // Only include FRIENDS visibility events
        if (event.visibility !== 'FRIENDS') continue;

        // Skip events the user is already a member of
        if (myEventIds.has(event._id)) continue;

        // Skip past events (if date is set and in the past)
        if (event.chosenDateTime && event.chosenDateTime < now) continue;

        // Get member count
        const memberCount = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect()
          .then(members => members.length);

        // Get image URL
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        // Get organizer data
        const organizerData = await getPersonWithUser(ctx, event.creatorId);

        discoverableEvents.push({
          eventId: event._id,
          title: event.title,
          description: event.description || null,
          location: event.location || null,
          chosenDateTime: event.chosenDateTime || null,
          chosenEndDateTime: event.chosenEndDateTime || null,
          imageUrl,
          memberCount,
          createdAt: event.createdAt,
          organizer: organizerData
            ? {
                personId: organizerData.person._id,
                name: organizerData.user?.name || null,
                username:
                  (
                    organizerData.user as {
                      username?: string | null;
                    } | null
                  )?.username || null,
                image: organizerData.user?.image || null,
              }
            : null,
        });
      }
    }

    // Sort by creation time (newest first)
    return discoverableEvents.sort((a, b) => b.createdAt - a.createdAt);
  },
});

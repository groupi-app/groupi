import { query, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import {
  getCurrentPerson,
  requireAuth,
  getPersonWithUser,
  resolveEventPermissions,
} from '../auth';
import { DEFAULT_EVENT_PERMISSIONS } from '../types';
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
      permissions: resolveEventPermissions(event),
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

    // Check viewAttendeeList permission
    const viewLevel =
      event.permissions?.viewAttendeeList ??
      DEFAULT_EVENT_PERMISSIONS.viewAttendeeList;
    const roleHierarchy: Record<string, number> = {
      ATTENDEE: 1,
      MODERATOR: 2,
      ORGANIZER: 3,
    };
    const requiredLevel =
      roleHierarchy[viewLevel === 'EVERYONE' ? 'ATTENDEE' : viewLevel] ?? 1;
    const userLevel = roleHierarchy[userMembership.role] ?? 0;
    if (userLevel < requiredLevel) {
      throw new Error('You do not have permission to view the attendee list');
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

    // Pre-fetch all potential dates and availabilities to avoid N+1
    const potentialDateTimes = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const potentialDateTimeMap = new Map(
      potentialDateTimes.map(pdt => [pdt._id, pdt])
    );

    const allAvailabilities = (
      await Promise.all(
        potentialDateTimes.map(pdt =>
          ctx.db
            .query('availabilities')
            .withIndex('by_potential_date', q =>
              q.eq('potentialDateTimeId', pdt._id)
            )
            .collect()
        )
      )
    ).flat();

    const availabilitiesByMembership = new Map<
      string,
      typeof allAvailabilities
    >();
    for (const avail of allAvailabilities) {
      const key = avail.membershipId as string;
      const existing = availabilitiesByMembership.get(key);
      if (existing) {
        existing.push(avail);
      } else {
        availabilitiesByMembership.set(key, [avail]);
      }
    }

    // Batch-fetch person data for all members
    type PersonData = NonNullable<
      Awaited<ReturnType<typeof getPersonWithUser>>
    >;
    const personMap = new Map<string, PersonData>();
    const batchedPersonData = await Promise.all(
      memberships.map(m =>
        getPersonWithUser(ctx, m.personId).then(data => ({
          id: m.personId as string,
          data,
        }))
      )
    );
    for (const { id, data } of batchedPersonData) {
      if (data) personMap.set(id, data);
    }

    const membershipsWithData = memberships.map(membership => {
      const memberData = personMap.get(membership.personId as string);

      const memberAvailabilities =
        availabilitiesByMembership.get(membership._id as string) || [];
      const availabilitiesWithDates = memberAvailabilities.map(avail => ({
        ...avail,
        potentialDateTime:
          potentialDateTimeMap.get(avail.potentialDateTimeId) ?? null,
      }));

      const isOwnMembership = membership.personId === currentPerson._id;
      const visibleRsvpNote =
        isOwnMembership || canSeeAllRsvpNotes ? membership.rsvpNote : undefined;

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
    });

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

        // Get the organizer (creator) data and image in parallel
        const [organizerData, imageUrl] = await Promise.all([
          getPersonWithUser(ctx, event.creatorId),
          event.imageStorageId
            ? ctx.storage.getUrl(event.imageStorageId)
            : null,
        ]);

        return {
          event: {
            ...event,
            imageUrl,
            chosenDateTime: event.chosenDateTime,
            memberCount: event.memberCount ?? 0,
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

    // Members may always access their event. Public events remain readable for
    // discovery, and friends-only events remain readable by accepted friends.
    // Private events must never become readable merely because the caller is
    // anonymous.
    const currentPerson = await getCurrentPerson(ctx);
    let hasAccess = event.visibility === 'PUBLIC';

    if (currentPerson) {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', currentPerson._id).eq('eventId', eventId)
        )
        .first();

      hasAccess = membership !== null || event.visibility === 'PUBLIC';

      if (!hasAccess && event.visibility === 'FRIENDS') {
        const [forwardFriendship, reverseFriendship] = await Promise.all([
          ctx.db
            .query('friendships')
            .withIndex('by_requester_addressee', q =>
              q
                .eq('requesterId', currentPerson._id)
                .eq('addresseeId', event.creatorId)
            )
            .first(),
          ctx.db
            .query('friendships')
            .withIndex('by_requester_addressee', q =>
              q
                .eq('requesterId', event.creatorId)
                .eq('addresseeId', currentPerson._id)
            )
            .first(),
        ]);

        hasAccess =
          forwardFriendship?.status === 'ACCEPTED' ||
          reverseFriendship?.status === 'ACCEPTED';
      }
    }

    if (!hasAccess) {
      throw new Error('Access denied to this event');
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

    // Determine if current user can see private notes (organizer/moderator)
    const canSeeAllNotes =
      userMembership.role === 'ORGANIZER' ||
      userMembership.role === 'MODERATOR';

    // Build a membership lookup map for efficient member resolution
    const membershipMap = new Map(validMembers.map(m => [m._id, m]));

    // Query availabilities per potential date time using the by_potential_date index
    // (avoids full table scan that would exceed read limits in production)
    const availabilitiesByDate = await Promise.all(
      potentialDates.map(async date => {
        const dateAvailabilities = await ctx.db
          .query('availabilities')
          .withIndex('by_potential_date', q =>
            q.eq('potentialDateTimeId', date._id)
          )
          .collect();

        return {
          potentialDateTime: date,
          availabilities: dateAvailabilities
            .map(avail => {
              const member = membershipMap.get(avail.membershipId);
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
      })
    );

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

        const [organizerData, imageUrl] = await Promise.all([
          getPersonWithUser(ctx, event.creatorId),
          event.imageStorageId
            ? ctx.storage.getUrl(event.imageStorageId)
            : null,
        ]);

        return {
          event: {
            ...event,
            imageUrl,
            chosenDateTime: event.chosenDateTime,
            memberCount: event.memberCount ?? 0,
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
        const [event, inviterPerson] = await Promise.all([
          ctx.db.get(invite.eventId),
          ctx.db.get(invite.inviterId),
        ]);
        if (!event || !inviterPerson) return null;

        const [inviterData, eventImageUrl] = await Promise.all([
          getPersonWithUser(ctx, inviterPerson._id),
          event.imageStorageId
            ? ctx.storage.getUrl(event.imageStorageId)
            : null,
        ]);

        return {
          inviteId: invite._id,
          eventId: event._id,
          eventTitle: event.title,
          eventDescription: event.description || null,
          eventImageUrl,
          eventLocation: event.location || null,
          eventDateTime: event.chosenDateTime || null,
          eventVisibility: event.visibility || 'PRIVATE',
          memberCount: event.memberCount ?? 0,
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
      // Get image URL
      const eventImageUrl = event.imageStorageId
        ? await ctx.storage.getUrl(event.imageStorageId)
        : null;

      eligibleEvents.push({
        eventId: event._id,
        title: event.title,
        location: event.location || null,
        chosenDateTime: event.chosenDateTime || null,
        memberCount: event.memberCount ?? 0,
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

    // Get accepted friendships using compound indexes (filter at DB level)
    const [acceptedAsRequester, acceptedAsAddressee] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_requester_status', q =>
          q.eq('requesterId', currentPerson._id).eq('status', 'ACCEPTED')
        )
        .collect(),
      ctx.db
        .query('friendships')
        .withIndex('by_addressee_status', q =>
          q.eq('addresseeId', currentPerson._id).eq('status', 'ACCEPTED')
        )
        .collect(),
    ]);

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

    // Fetch only FRIENDS-visibility events per friend using compound index
    const allFriendEvents = await Promise.all(
      friendPersonIds.map(friendPersonId =>
        ctx.db
          .query('events')
          .withIndex('by_creator_visibility', q =>
            q.eq('creatorId', friendPersonId).eq('visibility', 'FRIENDS')
          )
          .collect()
      )
    );

    const candidateEvents = allFriendEvents.flat().filter(event => {
      if (myEventIds.has(event._id)) return false;
      if (event.chosenDateTime && event.chosenDateTime < now) return false;
      return true;
    });

    // Fetch member counts, images, and organizer data in parallel per event
    const discoverableEvents = await Promise.all(
      candidateEvents.map(async event => {
        const [imageUrl, organizerData] = await Promise.all([
          event.imageStorageId
            ? ctx.storage.getUrl(event.imageStorageId)
            : null,
          getPersonWithUser(ctx, event.creatorId),
        ]);

        return {
          eventId: event._id,
          title: event.title,
          description: event.description || null,
          location: event.location || null,
          chosenDateTime: event.chosenDateTime || null,
          chosenEndDateTime: event.chosenEndDateTime || null,
          imageUrl,
          memberCount: event.memberCount ?? 0,
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
        };
      })
    );

    return discoverableEvents.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ===== INTERNAL QUERIES =====

/**
 * Internal query to get event data by ID.
 * Used by Discord actions to read event details for syncing.
 * No auth check — only called from internal actions.
 */
export const getEventById = internalQuery({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    return await ctx.db.get(eventId);
  },
});

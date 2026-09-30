import * as scheduling from './scheduling';
import { eventDocumentValidator } from './validators';
import { membershipDocumentValidator } from '../availability/contracts';
import {
  createEventArgs,
  createEventForPerson,
  updateEventArgs,
  updateEventForPerson,
  updatePotentialDateTimesArgs,
  updatePotentialDateTimesForPerson,
} from './writes';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';
import { notifyEventModerators, notifyPerson } from '../lib/notifications';
import { checkIfFriends } from '../lib/privacy';
import { getOrComputeMemberCount } from '../lib/memberCount';
import { cascadeDeleteEventData } from '../lib/cascade';
import { dispatchAddonLifecycle } from '../addons/lifecycle';

/**
 * Events mutations for the Convex backend
 *
 * These functions handle event creation, updates, membership management,
 * and other event-related operations with proper authentication.
 */

/**
 * Date time option for potential event dates
 */
/**
 * Reminder offset validator - how far before the event to send reminders
 */
const permissionLevelValidator = v.union(
  v.literal('EVERYONE'),
  v.literal('MODERATOR'),
  v.literal('ORGANIZER')
);

/**
 * Create a new event
 */
export const createEvent = mutation({
  args: createEventArgs.fields,
  returns: v.object({
    eventId: v.id('events'),
    membershipId: v.id('memberships'),
    event: v.union(eventDocumentValidator, v.null()),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createEventForPerson(ctx, person._id, args);
  },
});

/**
 * Update an existing event
 */
export const updateEvent = mutation({
  args: updateEventArgs.fields,
  returns: v.object({ event: v.union(eventDocumentValidator, v.null()) }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updateEventForPerson(ctx, person._id, args);
  },
});

/**
 * Delete an event (organizer only)
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.imageStorageId) {
      try {
        await ctx.storage.delete(event.imageStorageId);
      } catch {
        // Ignore errors - file may already be deleted
      }
    }

    await cascadeDeleteEventData(ctx, eventId);

    return { success: true };
  },
});

/**
 * Update user's RSVP status for an event
 */
export const updateRSVP = mutation({
  args: scheduling.updateRSVPArgs,
  returns: v.object({
    membership: v.union(membershipDocumentValidator, v.null()),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return scheduling.updateRSVPForPerson(ctx, person._id, args);
  },
});

/**
 * Update member role (organizer/moderator only)
 */
export const updateMemberRole = mutation({
  args: {
    membershipId: v.id('memberships'),
    newRole: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { membershipId, newRole }) => {
    // Get the membership to update
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    // Require organizer or moderator role in this event (single auth call)
    const { person: currentPerson, membership: currentMembership } =
      await requireEventRole(ctx, membership.eventId, 'MODERATOR');

    // Moderators can manage attendee/moderator roles, but organizer authority
    // can only be granted or changed by another organizer.
    if (
      currentMembership.role !== 'ORGANIZER' &&
      (membership.role === 'ORGANIZER' || newRole === 'ORGANIZER')
    ) {
      throw new Error('Only organizers can manage the organizer role');
    }

    // Prevent demoting the last organizer
    if (membership.role === 'ORGANIZER' && newRole !== 'ORGANIZER') {
      const organizers = await ctx.db
        .query('memberships')
        .withIndex('by_event_role', q =>
          q.eq('eventId', membership.eventId).eq('role', 'ORGANIZER')
        )
        .collect();

      if (organizers.length <= 1) {
        throw new Error('Cannot demote the last organizer');
      }
    }

    // Update the role
    await ctx.db.patch(membershipId, {
      role: newRole,
      updatedAt: Date.now(),
    });

    // Get the updated membership
    const updatedMembership = await ctx.db.get(membershipId);

    // Notify the affected user about their role change
    const notificationType =
      newRole === 'ORGANIZER' || newRole === 'MODERATOR'
        ? 'USER_PROMOTED'
        : 'USER_DEMOTED';

    await notifyPerson(ctx, {
      personId: membership.personId,
      type: notificationType,
      authorId: currentPerson._id,
      eventId: membership.eventId,
    });

    return { membership: updatedMembership };
  },
});

/**
 * Remove member from event (organizer/moderator only)
 */
export const removeMember = mutation({
  args: {
    membershipId: v.id('memberships'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { membershipId }) => {
    // Get the membership to remove
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    // Require organizer or moderator role in this event (single auth call)
    const { person: currentPerson, membership: currentMembership } =
      await requireEventRole(ctx, membership.eventId, 'MODERATOR');

    if (
      membership.role === 'ORGANIZER' &&
      currentMembership.role !== 'ORGANIZER'
    ) {
      throw new Error('Only organizers can remove another organizer');
    }

    // Prevent removing the last organizer
    if (membership.role === 'ORGANIZER') {
      const organizers = await ctx.db
        .query('memberships')
        .withIndex('by_event_role', q =>
          q.eq('eventId', membership.eventId).eq('role', 'ORGANIZER')
        )
        .collect();

      if (organizers.length <= 1) {
        throw new Error('Cannot remove the last organizer');
      }
    }

    // Delete all availabilities for this membership
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q => q.eq('membershipId', membershipId))
      .collect();

    for (const availability of availabilities) {
      await ctx.db.delete(availability._id);
    }

    // Notify the removed user (before deleting membership so we have eventId)
    await notifyPerson(ctx, {
      personId: membership.personId,
      type: 'USER_LEFT', // Using USER_LEFT as it indicates removal from event
      authorId: currentPerson._id,
      eventId: membership.eventId,
    });

    // Dispatch onMemberLeft lifecycle before deleting membership
    await dispatchAddonLifecycle(ctx, membership.eventId, 'onMemberLeft', {
      personId: membership.personId,
    });

    // Get count BEFORE deleting so fallback path counts correctly
    const event = await ctx.db.get(membership.eventId);
    const countBeforeDelete = event
      ? await getOrComputeMemberCount(ctx, membership.eventId, event)
      : 0;

    await ctx.db.delete(membershipId);

    if (event) {
      await ctx.db.patch(membership.eventId, {
        memberCount: Math.max(0, countBeforeDelete - 1),
      });
    }

    return { success: true };
  },
});

/**
 * Leave event (self-removal)
 */
export const leaveEvent = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Prevent the last organizer from leaving
    if (membership.role === 'ORGANIZER') {
      const organizers = await ctx.db
        .query('memberships')
        .withIndex('by_event_role', q =>
          q.eq('eventId', eventId).eq('role', 'ORGANIZER')
        )
        .collect();

      if (organizers.length <= 1) {
        throw new Error(
          'Cannot leave event as the last organizer. Transfer ownership first.'
        );
      }
    }

    // Delete all availabilities for this membership
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q => q.eq('membershipId', membership._id))
      .collect();

    for (const availability of availabilities) {
      await ctx.db.delete(availability._id);
    }

    // Notify organizers/moderators about member leaving (before deleting)
    await notifyEventModerators(ctx, {
      eventId,
      type: 'USER_LEFT',
      authorId: person._id,
    });

    // Dispatch onMemberLeft lifecycle before deleting membership
    await dispatchAddonLifecycle(ctx, eventId, 'onMemberLeft', {
      personId: person._id,
    });

    const eventDoc = await ctx.db.get(eventId);
    const countBeforeDelete = eventDoc
      ? await getOrComputeMemberCount(ctx, eventId, eventDoc)
      : 0;

    await ctx.db.delete(membership._id);

    if (eventDoc) {
      await ctx.db.patch(eventId, {
        memberCount: Math.max(0, countBeforeDelete - 1),
      });
    }

    return { success: true };
  },
});

/**
 * Choose final date for event (organizer only)
 * Note: Both chosenDateTime and chosenEndDateTime are updated together to prevent sync issues.
 * If chosenEndDateTime is not provided, it will be explicitly cleared.
 *
 * @param reminderOffset - Optional reminder timing. If provided, a reminder will be scheduled
 *                         for that amount of time before the event starts.
 *                         Options: '30_MINUTES', '1_HOUR', '2_HOURS', '4_HOURS', '1_DAY',
 *                                  '2_DAYS', '3_DAYS', '1_WEEK', '2_WEEKS', '4_WEEKS'
 */
export const chooseEventDate = mutation({
  args: scheduling.chooseEventDateArgs,
  returns: v.object({ event: v.union(eventDocumentValidator, v.null()) }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return scheduling.chooseEventDateForPerson(ctx, person._id, args);
  },
});

/**
 * Reset event date (clear chosen date, organizer only)
 * Also cancels any scheduled reminders via add-on lifecycle
 */
export const resetEventDate = mutation({
  args: scheduling.resetEventDateArgs,
  returns: v.object({ event: v.union(eventDocumentValidator, v.null()) }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return scheduling.resetEventDateForPerson(ctx, person._id, args);
  },
});

/**
 * Ban a member from an event (moderator+ only)
 * This kicks them and prevents them from rejoining via invites
 */
export const banMember = mutation({
  args: {
    membershipId: v.id('memberships'),
    reason: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { membershipId, reason }) => {
    // Get the membership to ban
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    // Require organizer or moderator role in this event (single auth call)
    const { person: currentPerson, membership: currentMembership } =
      await requireEventRole(ctx, membership.eventId, 'MODERATOR');

    // Prevent banning yourself
    if (membership.personId === currentPerson._id) {
      throw new Error('You cannot ban yourself');
    }

    if (
      membership.role === 'ORGANIZER' &&
      currentMembership.role !== 'ORGANIZER'
    ) {
      throw new Error('Only organizers can ban another organizer');
    }

    // Prevent banning the last organizer
    if (membership.role === 'ORGANIZER') {
      const organizers = await ctx.db
        .query('memberships')
        .withIndex('by_event_role', q =>
          q.eq('eventId', membership.eventId).eq('role', 'ORGANIZER')
        )
        .collect();

      if (organizers.length <= 1) {
        throw new Error('Cannot ban the last organizer');
      }
    }

    // Check if user is already banned
    const existingBan = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', membership.personId).eq('eventId', membership.eventId)
      )
      .first();

    if (existingBan) {
      throw new Error('User is already banned from this event');
    }

    // Create ban record
    const now = Date.now();
    await ctx.db.insert('eventBans', {
      personId: membership.personId,
      eventId: membership.eventId,
      bannedAt: now,
      bannedById: currentPerson._id,
      reason: reason,
      updatedAt: now,
    });

    // Delete all availabilities for this membership
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q => q.eq('membershipId', membershipId))
      .collect();

    for (const availability of availabilities) {
      await ctx.db.delete(availability._id);
    }

    // Dispatch onMemberLeft lifecycle before deleting membership
    await dispatchAddonLifecycle(ctx, membership.eventId, 'onMemberLeft', {
      personId: membership.personId,
    });

    const eventDoc = await ctx.db.get(membership.eventId);
    const countBeforeDelete = eventDoc
      ? await getOrComputeMemberCount(ctx, membership.eventId, eventDoc)
      : 0;

    await ctx.db.delete(membershipId);

    if (eventDoc) {
      await ctx.db.patch(membership.eventId, {
        memberCount: Math.max(0, countBeforeDelete - 1),
      });
    }

    return { success: true };
  },
});

/**
 * Unban a member from an event (moderator+ only)
 */
export const unbanMember = mutation({
  args: {
    eventId: v.id('events'),
    personId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, personId }) => {
    // Require organizer or moderator role
    await requireEventRole(ctx, eventId, 'MODERATOR');

    // Find and delete the ban record
    const ban = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', eventId)
      )
      .first();

    if (!ban) {
      throw new Error('User is not banned from this event');
    }

    await ctx.db.delete(ban._id);

    return { success: true };
  },
});

/**
 * Update potential date times for an event (organizer only)
 */
export const updatePotentialDateTimes = mutation({
  args: updatePotentialDateTimesArgs.fields,
  returns: v.object({
    success: v.boolean(),
    potentialDates: v.array(
      v.object({
        _id: v.id('potentialDateTimes'),
        _creationTime: v.number(),
        eventId: v.id('events'),
        dateTime: v.number(),
        endDateTime: v.optional(v.number()),
        note: v.optional(v.string()),
        updatedAt: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updatePotentialDateTimesForPerson(ctx, person._id, args);
  },
});

/**
 * Join a discoverable event (friends-visible) without an invite
 */
export const joinDiscoverableEvent = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);

    // Verify the event exists and has FRIENDS visibility
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.visibility !== 'FRIENDS') {
      throw new Error('This event is not open for discovery');
    }

    // Verify the user is friends with the event creator
    const isFriends = await checkIfFriends(ctx, person._id, event.creatorId);
    if (!isFriends) {
      throw new Error(
        'You must be friends with the event organizer to join this event'
      );
    }

    // Verify the user is not already a member
    const existingMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (existingMembership) {
      throw new Error('You are already a member of this event');
    }

    // Verify the user is not banned
    const ban = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (ban) {
      throw new Error('You are banned from this event');
    }

    const countBeforeInsert = await getOrComputeMemberCount(
      ctx,
      eventId,
      event
    );

    const now = Date.now();
    const membershipId = await ctx.db.insert('memberships', {
      personId: person._id,
      eventId: eventId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
      updatedAt: now,
    });
    await ctx.db.patch(eventId, {
      memberCount: countBeforeInsert + 1,
    });

    // Notify organizers/moderators about the new member
    await notifyEventModerators(ctx, {
      eventId,
      type: 'USER_JOINED',
      authorId: person._id,
    });

    // Dispatch onMemberJoined lifecycle
    await dispatchAddonLifecycle(ctx, eventId, 'onMemberJoined', {
      personId: person._id,
    });

    return { membershipId, success: true };
  },
});

export const updateEventPermissions = mutation({
  args: {
    eventId: v.id('events'),
    createPosts: v.optional(permissionLevelValidator),
    inviteMembers: v.optional(permissionLevelValidator),
    viewAttendeeList: v.optional(permissionLevelValidator),
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { eventId, createPosts, inviteMembers, viewAttendeeList }
  ) => {
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const currentPermissions = event.permissions ?? {};
    const updatedPermissions = {
      ...currentPermissions,
      ...(createPosts !== undefined && { createPosts }),
      ...(inviteMembers !== undefined && { inviteMembers }),
      ...(viewAttendeeList !== undefined && { viewAttendeeList }),
    };

    await ctx.db.patch(eventId, {
      permissions: updatedPermissions,
      updatedAt: Date.now(),
    });
  },
});

import { updateAdmissionPolicyForPerson } from './admission';
import {
  admissionPolicyValidator,
  admissionPolicyResultValidator,
} from './admissionContracts';
import {
  updateEventPermissionsForPerson,
  deleteEventForPerson,
  updateMemberRoleForPerson,
  removeMemberForPerson,
  leaveEventForPerson,
  joinDiscoverableEventForPerson,
} from './management';
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
import { getOrComputeMemberCount } from '../lib/memberCount';
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
    const { person } = await requireAuth(ctx);
    return deleteEventForPerson(ctx, person._id, eventId);
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
    const { person } = await requireAuth(ctx);
    return updateMemberRoleForPerson(ctx, person._id, membershipId, newRole);
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
    const { person } = await requireAuth(ctx);
    return removeMemberForPerson(ctx, person._id, membershipId);
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
    const { person } = await requireAuth(ctx);
    return leaveEventForPerson(ctx, person._id, eventId);
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
    return joinDiscoverableEventForPerson(ctx, person._id, eventId);
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
    const { person } = await requireAuth(ctx);
    await updateEventPermissionsForPerson(ctx, person._id, {
      eventId,
      createPosts,
      inviteMembers,
      viewAttendeeList,
    });
  },
});

/** Event admission authority is independent of visibility and ordinary invitation permission. */
export const updateAdmissionPolicy = mutation({
  args: { eventId: v.id('events'), admissionPolicy: admissionPolicyValidator },
  returns: admissionPolicyResultValidator,
  handler: async (ctx, { eventId, admissionPolicy }) => {
    const { person } = await requireAuth(ctx);
    return updateAdmissionPolicyForPerson(
      ctx,
      person._id,
      eventId,
      admissionPolicy
    );
  },
});

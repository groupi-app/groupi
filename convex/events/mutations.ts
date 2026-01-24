import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';
import {
  notifyEventMembers,
  notifyEventModerators,
  notifyPerson,
} from '../lib/notifications';
import { Doc } from '../_generated/dataModel';
import { internal } from '../_generated/api';

/**
 * Events mutations for the Convex backend
 *
 * These functions handle event creation, updates, membership management,
 * and other event-related operations with proper authentication.
 */

/**
 * Date time option for potential event dates
 */
const dateTimeOptionValidator = v.object({
  start: v.string(), // ISO date string
  end: v.optional(v.string()), // ISO date string (optional end time)
});

/**
 * Reminder offset validator - how far before the event to send reminders
 */
const reminderOffsetValidator = v.union(
  v.literal('30_MINUTES'),
  v.literal('1_HOUR'),
  v.literal('2_HOURS'),
  v.literal('4_HOURS'),
  v.literal('1_DAY'),
  v.literal('2_DAYS'),
  v.literal('3_DAYS'),
  v.literal('1_WEEK'),
  v.literal('2_WEEKS'),
  v.literal('4_WEEKS')
);

/**
 * Create a new event
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    // Legacy: array of ISO date strings (backward compatible)
    potentialDateTimes: v.optional(v.array(v.string())),
    // New: array of objects with start/end times
    potentialDateTimeOptions: v.optional(v.array(dateTimeOptionValidator)),
    chosenDateTime: v.optional(v.string()), // ISO date string for single-date events
    chosenEndDateTime: v.optional(v.string()), // ISO date string for end time
    reminderOffset: v.optional(reminderOffsetValidator), // How far before event to send reminder
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      title,
      description,
      location,
      potentialDateTimes,
      potentialDateTimeOptions,
      chosenDateTime,
      chosenEndDateTime,
      reminderOffset,
    }
  ) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Validate input
    if (!title.trim()) {
      throw new Error('Event title is required');
    }

    // Handle potential date times - support both legacy and new format
    let dateTimeOptions: Array<{ start: number; end?: number }> = [];

    if (potentialDateTimeOptions && potentialDateTimeOptions.length > 0) {
      // New format: objects with start/end
      dateTimeOptions = potentialDateTimeOptions.map(opt => ({
        start: new Date(opt.start).getTime(),
        end: opt.end ? new Date(opt.end).getTime() : undefined,
      }));
    } else if (potentialDateTimes && potentialDateTimes.length > 0) {
      // Legacy format: array of strings (just start times)
      dateTimeOptions = potentialDateTimes.map(dateStr => ({
        start: new Date(dateStr).getTime(),
      }));
    }

    // Validate all potential date time options have end > start
    for (const opt of dateTimeOptions) {
      if (opt.end && opt.end <= opt.start) {
        throw new Error(
          'End time must be after start time for all date options'
        );
      }
    }

    // Convert chosen date time if provided
    const chosenTimestamp = chosenDateTime
      ? new Date(chosenDateTime).getTime()
      : undefined;
    const chosenEndTimestamp = chosenEndDateTime
      ? new Date(chosenEndDateTime).getTime()
      : undefined;

    // Validate chosen end time is after start time if both provided
    if (
      chosenTimestamp &&
      chosenEndTimestamp &&
      chosenEndTimestamp <= chosenTimestamp
    ) {
      throw new Error('End time must be after start time');
    }

    // Create the event
    const now = Date.now();
    const eventId = await ctx.db.insert('events', {
      title: title.trim(),
      description: description?.trim() || '',
      location: location?.trim() || '',
      creatorId: person._id,
      createdAt: now,
      updatedAt: now,
      timezone: 'UTC', // Default timezone, can be updated later
      potentialDateTimes: dateTimeOptions.map(opt => opt.start), // Legacy array field
      chosenDateTime: chosenTimestamp,
      chosenEndDateTime: chosenEndTimestamp,
      reminderOffset: reminderOffset,
    });

    // Create the creator's membership as ORGANIZER
    const membershipId = await ctx.db.insert('memberships', {
      personId: person._id,
      eventId: eventId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES', // Creator auto-accepts
      updatedAt: now,
    });

    // Create potentialDateTimes records and default availabilities for the organizer
    if (dateTimeOptions.length > 0) {
      const potentialDateTimeIds = await Promise.all(
        dateTimeOptions.map(async opt => {
          return await ctx.db.insert('potentialDateTimes', {
            eventId: eventId,
            dateTime: opt.start,
            endDateTime: opt.end,
            updatedAt: now,
          });
        })
      );

      // Create "YES" availabilities for the organizer for all date options
      await Promise.all(
        potentialDateTimeIds.map(async potentialDateTimeId => {
          await ctx.db.insert('availabilities', {
            membershipId: membershipId,
            potentialDateTimeId: potentialDateTimeId,
            status: 'YES',
            updatedAt: now,
          });
        })
      );
    }

    // Get the created event
    const event = await ctx.db.get(eventId);

    // Schedule reminder if event was created with both a date and reminder offset
    if (chosenTimestamp && reminderOffset) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589) due to complex return type
      const reminderFn = internal.reminders.mutations.scheduleEventReminder;
      await ctx.scheduler.runAfter(0, reminderFn, {
        eventId,
        reminderOffset,
      });
    }

    return {
      eventId,
      membershipId,
      event,
    };
  },
});

/**
 * Update an existing event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id('events'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    reminderOffset: v.optional(
      v.union(
        reminderOffsetValidator,
        v.null() // Allow null to clear the reminder
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { eventId, title, description, location, reminderOffset }
  ) => {
    // Require organizer or moderator role
    await requireEventRole(ctx, eventId, 'MODERATOR');

    // Get the event
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Prepare update data
    const updateData: Partial<Doc<'events'>> = {};

    if (title !== undefined) {
      if (!title.trim()) {
        throw new Error('Event title cannot be empty');
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (location !== undefined) {
      updateData.location = location.trim();
    }

    if (reminderOffset !== undefined) {
      // If null is passed, clear the reminder; otherwise set it
      updateData.reminderOffset =
        reminderOffset === null ? undefined : reminderOffset;
    }

    // Update the event
    updateData.updatedAt = Date.now();
    await ctx.db.patch(eventId, updateData);

    // Get the updated event
    const updatedEvent = await ctx.db.get(eventId);

    // Handle reminder reschedule/cancel when reminderOffset changes
    if (reminderOffset !== undefined) {
      if (reminderOffset === null) {
        // Clear reminder - cancel any scheduled reminders
        await ctx.scheduler.runAfter(
          0,
          internal.reminders.mutations.cancelEventReminders,
          { eventId }
        );
      } else if (updatedEvent?.chosenDateTime) {
        // Reminder offset changed and event has a date - reschedule reminder
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Type instantiation is excessively deep (TS2589)
        const reminderFn = internal.reminders.mutations.scheduleEventReminder;
        await ctx.scheduler.runAfter(0, reminderFn, {
          eventId,
          reminderOffset,
        });
      }
    }

    // Get the current user's person ID for the notification author
    const { person } = await requireAuth(ctx);

    // Notify all event members about the edit
    await notifyEventMembers(ctx, {
      eventId,
      type: 'EVENT_EDITED',
      authorId: person._id,
    });

    return { event: updatedEvent };
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
    // Require organizer role only
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    // Delete all related data in order (to avoid foreign key issues)

    // 1. Delete all availabilities for this event
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const membership of memberships) {
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();

      for (const availability of availabilities) {
        await ctx.db.delete(availability._id);
      }
    }

    // 2. Delete potential date times
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const date of potentialDates) {
      await ctx.db.delete(date._id);
    }

    // 3. Delete replies to posts in this event
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const post of posts) {
      const replies = await ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect();

      for (const reply of replies) {
        await ctx.db.delete(reply._id);
      }
    }

    // 4. Delete posts
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // 5. Delete invites
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // 6. Delete notifications
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // 7. Cancel and delete reminders
    const reminders = await ctx.db
      .query('eventReminders')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const reminder of reminders) {
      // Cancel the scheduled function if it exists
      if (reminder.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(reminder.scheduledFunctionId);
        } catch {
          // Ignore - job may have already run
        }
      }
      await ctx.db.delete(reminder._id);
    }

    // 8. Delete memberships
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // 9. Finally, delete the event
    await ctx.db.delete(eventId);

    return { success: true };
  },
});

/**
 * Update user's RSVP status for an event
 */
export const updateRSVP = mutation({
  args: {
    eventId: v.id('events'),
    rsvpStatus: v.union(
      v.literal('YES'),
      v.literal('MAYBE'),
      v.literal('NO'),
      v.literal('PENDING')
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, rsvpStatus }) => {
    // Require authentication and membership
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

    // Update the RSVP status
    await ctx.db.patch(membership._id, {
      rsvpStatus: rsvpStatus,
      updatedAt: Date.now(),
    });

    // Get the updated membership
    const updatedMembership = await ctx.db.get(membership._id);

    // Notify organizers/moderators about RSVP change
    await notifyEventModerators(ctx, {
      eventId,
      type: 'USER_RSVP',
      authorId: person._id,
      rsvp: rsvpStatus,
    });

    return { membership: updatedMembership };
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

    // Require organizer or moderator role in this event
    await requireEventRole(ctx, membership.eventId, 'MODERATOR');

    // Prevent demoting the last organizer
    if (membership.role === 'ORGANIZER' && newRole !== 'ORGANIZER') {
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', membership.eventId))
        .collect()
        .then(
          memberships => memberships.filter(m => m.role === 'ORGANIZER').length
        );

      if (organizerCount <= 1) {
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

    // Get the current user's person ID for the notification author
    const { person: currentPerson } = await requireAuth(ctx);

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

    // Require organizer or moderator role in this event
    await requireEventRole(ctx, membership.eventId, 'MODERATOR');

    // Prevent removing the last organizer
    if (membership.role === 'ORGANIZER') {
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', membership.eventId))
        .collect()
        .then(
          memberships => memberships.filter(m => m.role === 'ORGANIZER').length
        );

      if (organizerCount <= 1) {
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

    // Get the current user's person ID for the notification author
    const { person: currentPerson } = await requireAuth(ctx);

    // Notify the removed user (before deleting membership so we have eventId)
    await notifyPerson(ctx, {
      personId: membership.personId,
      type: 'USER_LEFT', // Using USER_LEFT as it indicates removal from event
      authorId: currentPerson._id,
      eventId: membership.eventId,
    });

    // Delete the membership
    await ctx.db.delete(membershipId);

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
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect()
        .then(
          memberships => memberships.filter(m => m.role === 'ORGANIZER').length
        );

      if (organizerCount <= 1) {
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

    // Delete the membership
    await ctx.db.delete(membership._id);

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
  args: {
    eventId: v.id('events'),
    chosenDateTime: v.number(), // Unix timestamp
    chosenEndDateTime: v.optional(v.number()), // Unix timestamp for end time
    reminderOffset: v.optional(reminderOffsetValidator),
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { eventId, chosenDateTime, chosenEndDateTime, reminderOffset }
  ) => {
    // Require organizer role
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    // Validate end time is after start time if provided
    if (chosenEndDateTime && chosenEndDateTime <= chosenDateTime) {
      throw new Error('End time must be after start time');
    }

    // Update the event with chosen date
    // Always set both fields together to prevent sync issues
    // If endDateTime not provided, explicitly clear it
    await ctx.db.patch(eventId, {
      chosenDateTime: chosenDateTime,
      chosenEndDateTime: chosenEndDateTime ?? undefined,
      updatedAt: Date.now(),
    });

    // Get the updated event
    const updatedEvent = await ctx.db.get(eventId);

    // Get the current user's person ID for the notification author
    const { person } = await requireAuth(ctx);

    // Notify all members about date being chosen
    await notifyEventMembers(ctx, {
      eventId,
      type: 'DATE_CHOSEN',
      authorId: person._id,
      datetime: chosenDateTime,
    });

    // Schedule reminder if requested (use passed value, or fall back to event's stored value)
    const effectiveReminderOffset =
      reminderOffset ?? updatedEvent?.reminderOffset;
    if (effectiveReminderOffset) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589) due to complex return type
      const reminderFn = internal.reminders.mutations.scheduleEventReminder;
      await ctx.scheduler.runAfter(0, reminderFn, {
        eventId,
        reminderOffset: effectiveReminderOffset,
      });
    }

    return { event: updatedEvent };
  },
});

/**
 * Reset event date (clear chosen date, organizer only)
 * Also cancels any scheduled reminders
 */
export const resetEventDate = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require organizer role
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    // Cancel any scheduled reminders
    await ctx.scheduler.runAfter(
      0,
      internal.reminders.mutations.cancelEventReminders,
      { eventId }
    );

    // Update the event to remove chosen date and end date
    await ctx.db.patch(eventId, {
      chosenDateTime: undefined,
      chosenEndDateTime: undefined,
      updatedAt: Date.now(),
    });

    // Get the updated event
    const updatedEvent = await ctx.db.get(eventId);

    // Get the current user's person ID for the notification author
    const { person } = await requireAuth(ctx);

    // Notify all members about date being reset
    await notifyEventMembers(ctx, {
      eventId,
      type: 'DATE_RESET',
      authorId: person._id,
    });

    return { event: updatedEvent };
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

    // Require organizer or moderator role in this event
    await requireEventRole(ctx, membership.eventId, 'MODERATOR');

    // Get the current user's person ID
    const { person: currentPerson } = await requireAuth(ctx);

    // Prevent banning yourself
    if (membership.personId === currentPerson._id) {
      throw new Error('You cannot ban yourself');
    }

    // Prevent banning the last organizer
    if (membership.role === 'ORGANIZER') {
      const organizerCount = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', membership.eventId))
        .collect()
        .then(
          memberships => memberships.filter(m => m.role === 'ORGANIZER').length
        );

      if (organizerCount <= 1) {
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

    // Delete the membership
    await ctx.db.delete(membershipId);

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
  args: {
    eventId: v.id('events'),
    // Legacy: array of Unix timestamps (backward compatible)
    potentialDateTimes: v.optional(v.array(v.number())),
    // New: array of objects with start/end times
    potentialDateTimeOptions: v.optional(
      v.array(
        v.object({
          start: v.number(), // Unix timestamp
          end: v.optional(v.number()), // Unix timestamp for end time
        })
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { eventId, potentialDateTimes, potentialDateTimeOptions }
  ) => {
    // Require organizer role
    await requireEventRole(ctx, eventId, 'ORGANIZER');

    // Handle both legacy and new format
    let dateTimeOptions: Array<{ start: number; end?: number }> = [];

    if (potentialDateTimeOptions && potentialDateTimeOptions.length > 0) {
      // New format: objects with start/end
      dateTimeOptions = potentialDateTimeOptions;
    } else if (potentialDateTimes && potentialDateTimes.length > 0) {
      // Legacy format: array of timestamps (just start times)
      dateTimeOptions = potentialDateTimes.map(timestamp => ({
        start: timestamp,
      }));
    }

    // Validate end times are after start times
    for (const opt of dateTimeOptions) {
      if (opt.end && opt.end <= opt.start) {
        throw new Error('End time must be after start time');
      }
    }

    // Delete all existing potential date times for this event
    const existingDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const date of existingDates) {
      // Delete all availabilities for this potential date time
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_potential_date', q =>
          q.eq('potentialDateTimeId', date._id)
        )
        .collect();

      for (const availability of availabilities) {
        await ctx.db.delete(availability._id);
      }

      await ctx.db.delete(date._id);
    }

    // Create new potential date times
    const now = Date.now();
    const newPotentialDateTimeIds = await Promise.all(
      dateTimeOptions.map(async opt => {
        return await ctx.db.insert('potentialDateTimes', {
          eventId: eventId,
          dateTime: opt.start,
          endDateTime: opt.end,
          updatedAt: now,
        });
      })
    );

    // Get the current user's person ID for the notification author
    const { person } = await requireAuth(ctx);

    // Get the organizer's membership to create default availabilities
    const organizerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    // Create "YES" availabilities for the organizer for all new date options
    if (organizerMembership) {
      await Promise.all(
        newPotentialDateTimeIds.map(async potentialDateTimeId => {
          await ctx.db.insert('availabilities', {
            membershipId: organizerMembership._id,
            potentialDateTimeId: potentialDateTimeId,
            status: 'YES',
            updatedAt: now,
          });
        })
      );
    }

    // Get the updated potential date times
    const updatedPotentialDates = await Promise.all(
      newPotentialDateTimeIds.map(id => ctx.db.get(id))
    );

    // Cancel any scheduled reminders since we're starting a new poll
    // (the chosen date will likely change, so any existing reminder is invalid)
    await ctx.scheduler.runAfter(
      0,
      internal.reminders.mutations.cancelEventReminders,
      { eventId }
    );

    // Notify all members about new date options (using DATE_CHANGED type)
    await notifyEventMembers(ctx, {
      eventId,
      type: 'DATE_CHANGED',
      authorId: person._id,
    });

    return {
      potentialDates: updatedPotentialDates.filter(d => d !== null),
      success: true,
    };
  },
});

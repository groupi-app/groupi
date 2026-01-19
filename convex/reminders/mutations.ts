import { internalMutation, MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { REMINDER_OFFSETS, ReminderOffset } from '../types';
import {
  createNotification,
  shouldSkipNotificationDueToMute,
} from '../lib/notifications';

/**
 * Helper to cancel existing reminders (shared logic)
 */
async function cancelExistingReminders(
  ctx: MutationCtx,
  eventId: Id<'events'>
): Promise<number> {
  const existingReminders = await ctx.db
    .query('eventReminders')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .filter(q => q.eq(q.field('status'), 'SCHEDULED'))
    .collect();

  for (const reminder of existingReminders) {
    if (reminder.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(reminder.scheduledFunctionId);
      } catch {
        // Ignore - job may have already run
      }
    }
    await ctx.db.patch(reminder._id, { status: 'CANCELLED' });
  }

  return existingReminders.length;
}

/**
 * Reminder offset validator matching the schema
 */
const reminderOffsetValidator = v.union(
  v.literal('15_MINUTES'),
  v.literal('1_HOUR'),
  v.literal('1_DAY'),
  v.literal('1_WEEK')
);

/**
 * Schedule a reminder for an event
 * Called internally when an organizer chooses a date with a reminder offset
 */
export const scheduleEventReminder = internalMutation({
  args: {
    eventId: v.id('events'),
    reminderOffset: reminderOffsetValidator,
  },
  returns: v.union(v.id('eventReminders'), v.null()),
  handler: async (
    ctx,
    { eventId, reminderOffset }
  ): Promise<Id<'eventReminders'> | null> => {
    const event = await ctx.db.get(eventId);
    if (!event?.chosenDateTime) {
      console.log(
        `[Reminders] Event ${eventId} has no chosen date, skipping reminder`
      );
      return null;
    }

    // Cancel any existing scheduled reminders first
    await cancelExistingReminders(ctx, eventId);

    const offsetMs = REMINDER_OFFSETS[reminderOffset as ReminderOffset];
    const reminderTime = event.chosenDateTime - offsetMs;
    const now = Date.now();

    // Only schedule if reminder time is in the future
    if (reminderTime <= now) {
      console.log(
        `[Reminders] Reminder time ${new Date(reminderTime).toISOString()} is in the past, skipping`
      );
      return null;
    }

    // Schedule the reminder using Convex scheduler
    const scheduledId = await ctx.scheduler.runAt(
      reminderTime,
      internal.reminders.mutations.sendReminder,
      { eventId, reminderOffset }
    );

    // Store the reminder record
    const reminderId = await ctx.db.insert('eventReminders', {
      eventId,
      scheduledTime: reminderTime,
      reminderOffset: reminderOffset as ReminderOffset,
      scheduledFunctionId: scheduledId,
      status: 'SCHEDULED',
    });

    console.log(
      `[Reminders] Scheduled ${reminderOffset} reminder for event ${eventId} at ${new Date(reminderTime).toISOString()}`
    );

    return reminderId;
  },
});

/**
 * Send the reminder notification to all event members
 * Called by Convex scheduler at the scheduled time
 */
export const sendReminder = internalMutation({
  args: {
    eventId: v.id('events'),
    reminderOffset: reminderOffsetValidator,
  },
  returns: v.object({ sent: v.number(), skipped: v.number() }),
  handler: async (
    ctx,
    { eventId, reminderOffset }
  ): Promise<{ sent: number; skipped: number }> => {
    const event = await ctx.db.get(eventId);
    if (!event?.chosenDateTime) {
      console.log(
        `[Reminders] Event ${eventId} no longer has a chosen date, skipping reminder`
      );
      return { sent: 0, skipped: 0 };
    }

    // Update reminder status to SENT
    const reminder = await ctx.db
      .query('eventReminders')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .filter(q => q.eq(q.field('reminderOffset'), reminderOffset))
      .filter(q => q.eq(q.field('status'), 'SCHEDULED'))
      .first();

    if (reminder) {
      await ctx.db.patch(reminder._id, { status: 'SENT' });
    }

    // Get all memberships for this event who RSVP'd YES or MAYBE
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const attendingMembers = memberships.filter(
      m => m.rsvpStatus === 'YES' || m.rsvpStatus === 'MAYBE'
    );

    let sent = 0;
    let skipped = 0;

    // Create notification for each attending member (respecting mute settings)
    for (const membership of attendingMembers) {
      // Check if user has muted this event
      const shouldSkip = await shouldSkipNotificationDueToMute(
        ctx,
        membership.personId,
        eventId
      );

      if (shouldSkip) {
        skipped++;
        continue;
      }

      await createNotification(ctx, {
        personId: membership.personId,
        type: 'EVENT_REMINDER',
        eventId: eventId,
        datetime: event.chosenDateTime,
        // No authorId - this is a system-generated notification
      });
      sent++;
    }

    console.log(
      `[Reminders] Sent ${sent} reminder notifications for event ${eventId} (${skipped} skipped due to muting)`
    );

    return { sent, skipped };
  },
});

/**
 * Cancel all scheduled reminders for an event
 * Called when date is reset or changed
 */
export const cancelEventReminders = internalMutation({
  args: {
    eventId: v.id('events'),
  },
  returns: v.object({ cancelled: v.number() }),
  handler: async (ctx, { eventId }): Promise<{ cancelled: number }> => {
    const cancelled = await cancelExistingReminders(ctx, eventId);

    if (cancelled > 0) {
      console.log(
        `[Reminders] Cancelled ${cancelled} reminders for event ${eventId}`
      );
    }

    return { cancelled };
  },
});

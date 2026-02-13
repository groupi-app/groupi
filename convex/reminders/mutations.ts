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
    await ctx.db.patch(reminder._id, {
      status: 'CANCELLED',
      updatedAt: Date.now(),
    });
  }

  return existingReminders.length;
}

/**
 * Reminder offset validator matching the schema
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589) due to complex return type
    const reminderFn = internal.reminders.mutations.sendReminder;
    const scheduledId = await ctx.scheduler.runAt(reminderTime, reminderFn, {
      eventId,
      reminderOffset,
    });

    // Store the reminder record
    const reminderId = await ctx.db.insert('eventReminders', {
      eventId,
      scheduledTime: reminderTime,
      reminderOffset: reminderOffset as ReminderOffset,
      scheduledFunctionId: scheduledId,
      status: 'SCHEDULED',
      updatedAt: now,
    });

    console.log(
      `[Reminders] Scheduled ${reminderOffset} reminder for event ${eventId} at ${new Date(reminderTime).toISOString()}`
    );

    return reminderId;
  },
});

/**
 * Send the reminder notification to event members
 * Called by Convex scheduler at the scheduled time
 *
 * Users who have RSVP'd YES/MAYBE receive a standard reminder.
 * Users who are PENDING receive a reminder prompting them to RSVP.
 * Users who RSVP'd NO are NOT notified (they've already declined).
 */
export const sendReminder = internalMutation({
  args: {
    eventId: v.id('events'),
    reminderOffset: reminderOffsetValidator,
  },
  returns: v.object({
    sent: v.number(),
    skipped: v.number(),
    sentToAttending: v.number(),
    sentToNonRsvp: v.number(),
  }),
  handler: async (
    ctx,
    { eventId, reminderOffset }
  ): Promise<{
    sent: number;
    skipped: number;
    sentToAttending: number;
    sentToNonRsvp: number;
  }> => {
    const event = await ctx.db.get(eventId);
    if (!event?.chosenDateTime) {
      console.log(
        `[Reminders] Event ${eventId} no longer has a chosen date, skipping reminder`
      );
      return { sent: 0, skipped: 0, sentToAttending: 0, sentToNonRsvp: 0 };
    }

    // Update reminder status to SENT
    const reminder = await ctx.db
      .query('eventReminders')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .filter(q => q.eq(q.field('reminderOffset'), reminderOffset))
      .filter(q => q.eq(q.field('status'), 'SCHEDULED'))
      .first();

    if (reminder) {
      await ctx.db.patch(reminder._id, {
        status: 'SENT',
        updatedAt: Date.now(),
      });
    }

    // Get all memberships for this event
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    let sent = 0;
    let skipped = 0;
    let sentToAttending = 0;
    let sentToNonRsvp = 0;

    // Create notification for each member (respecting mute settings)
    for (const membership of memberships) {
      // Skip users who RSVP'd NO - they've already declined
      if (membership.rsvpStatus === 'NO') {
        skipped++;
        continue;
      }

      // Check if user has opted out of reminders for this event
      // Check both new addonOptOuts table and legacy reminderOptOuts table
      const addonOptOut = await ctx.db
        .query('addonOptOuts')
        .withIndex('by_person_event_addon', q =>
          q
            .eq('personId', membership.personId)
            .eq('eventId', eventId)
            .eq('addonType', 'reminders')
        )
        .first();

      const legacyOptOut = await ctx.db
        .query('reminderOptOuts')
        .withIndex('by_person_event', q =>
          q.eq('personId', membership.personId).eq('eventId', eventId)
        )
        .first();

      if (addonOptOut || legacyOptOut) {
        skipped++;
        continue;
      }

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

      const isAttending =
        membership.rsvpStatus === 'YES' || membership.rsvpStatus === 'MAYBE';

      await createNotification(ctx, {
        personId: membership.personId,
        type: 'EVENT_REMINDER',
        eventId: eventId,
        datetime: event.chosenDateTime,
        // Include RSVP status so the frontend can show different messages:
        // - For YES/MAYBE: "Event starting soon"
        // - For PENDING: "Event starting soon - don't forget to RSVP!"
        rsvp: membership.rsvpStatus,
        // No authorId - this is a system-generated notification
      });
      sent++;

      if (isAttending) {
        sentToAttending++;
      } else {
        sentToNonRsvp++;
      }
    }

    console.log(
      `[Reminders] Sent ${sent} reminder notifications for event ${eventId} ` +
        `(${sentToAttending} attending, ${sentToNonRsvp} pending RSVP, ${skipped} skipped)`
    );

    return { sent, skipped, sentToAttending, sentToNonRsvp };
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

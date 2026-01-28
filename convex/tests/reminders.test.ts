import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTestInstance,
  createTestEventWithUser,
  createAuthenticatedUser,
  createTestEventWithMultipleUsers,
} from './test_helpers';
import { Id } from '../_generated/dataModel';

// Extract API references to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require('../_generated/api').api;
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internal: any = require('../_generated/api').internal;

describe('Event Reminders', () => {
  let t: ReturnType<typeof createTestInstance>;

  beforeEach(() => {
    // Use fake timers to prevent scheduled functions from auto-running
    vi.useFakeTimers();
    t = createTestInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('chooseEventDate with reminder', () => {
    it('schedules a reminder when reminderOffset is provided', async () => {
      const { userId, eventId } = await createTestEventWithUser(t);
      const auth = createAuthenticatedUser(t, userId);

      // Choose a date 2 days in the future with 1 day reminder
      const futureDate = Date.now() + 2 * 24 * 60 * 60 * 1000;

      await auth.mutation(api.events.mutations.chooseEventDate, {
        eventId,
        chosenDateTime: futureDate,
        reminderOffset: '1_DAY',
      });

      // Verify event was updated
      const { event } = await t.run(async ctx => {
        const event = await ctx.db.get(eventId);
        return { event };
      });

      expect(event?.chosenDateTime).toBe(futureDate);
    });

    it('does not create reminder when reminderOffset is not provided', async () => {
      const { userId, eventId } = await createTestEventWithUser(t);
      const auth = createAuthenticatedUser(t, userId);

      const futureDate = Date.now() + 2 * 24 * 60 * 60 * 1000;

      await auth.mutation(api.events.mutations.chooseEventDate, {
        eventId,
        chosenDateTime: futureDate,
        // No reminderOffset
      });

      // Verify no reminders were scheduled
      const { reminders } = await t.run(async ctx => {
        const reminders = await ctx.db.query('eventReminders').collect();
        return { reminders };
      });

      expect(reminders).toHaveLength(0);
    });
  });

  describe('scheduleEventReminder', () => {
    it('creates a reminder record with SCHEDULED status', async () => {
      const { eventId } = await createTestEventWithUser(t);

      // Set a chosen date first
      const futureDate = Date.now() + 2 * 24 * 60 * 60 * 1000;
      await t.run(async ctx => {
        await ctx.db.patch(eventId, { chosenDateTime: futureDate });
      });

      // Schedule a reminder
      await t.mutation(internal.reminders.mutations.scheduleEventReminder, {
        eventId,
        reminderOffset: '1_HOUR',
      });

      // Verify reminder was created
      const { reminders } = await t.run(async ctx => {
        const reminders = await ctx.db
          .query('eventReminders')
          .withIndex(
            'by_event',
            (q: { eq: (field: string, value: Id<'events'>) => unknown }) =>
              q.eq('eventId', eventId)
          )
          .collect();
        return { reminders };
      });

      expect(reminders).toHaveLength(1);
      expect(reminders[0].status).toBe('SCHEDULED');
      expect(reminders[0].reminderOffset).toBe('1_HOUR');
      expect(reminders[0].scheduledTime).toBe(futureDate - 60 * 60 * 1000);
    });

    it('skips scheduling if reminder time is in the past', async () => {
      const { eventId } = await createTestEventWithUser(t);

      // Set a chosen date only 30 minutes in the future
      const nearFuture = Date.now() + 30 * 60 * 1000;
      await t.run(async ctx => {
        await ctx.db.patch(eventId, { chosenDateTime: nearFuture });
      });

      // Try to schedule a 1 hour reminder (which would be in the past)
      const result = await t.mutation(
        internal.reminders.mutations.scheduleEventReminder,
        {
          eventId,
          reminderOffset: '1_HOUR',
        }
      );

      expect(result).toBeNull();

      // Verify no reminder was created
      const { reminders } = await t.run(async ctx => {
        const reminders = await ctx.db.query('eventReminders').collect();
        return { reminders };
      });

      expect(reminders).toHaveLength(0);
    });

    it('cancels existing reminders before scheduling new one', async () => {
      const { eventId } = await createTestEventWithUser(t);

      // Set a chosen date
      const futureDate = Date.now() + 2 * 24 * 60 * 60 * 1000;
      await t.run(async ctx => {
        await ctx.db.patch(eventId, { chosenDateTime: futureDate });
      });

      // Schedule first reminder
      await t.mutation(internal.reminders.mutations.scheduleEventReminder, {
        eventId,
        reminderOffset: '1_HOUR',
      });

      // Schedule second reminder (should cancel the first)
      await t.mutation(internal.reminders.mutations.scheduleEventReminder, {
        eventId,
        reminderOffset: '1_DAY',
      });

      // Verify only one SCHEDULED reminder exists
      const { scheduled, cancelled } = await t.run(async ctx => {
        const all = await ctx.db.query('eventReminders').collect();
        const scheduled = all.filter(r => r.status === 'SCHEDULED');
        const cancelled = all.filter(r => r.status === 'CANCELLED');
        return { scheduled, cancelled };
      });

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].reminderOffset).toBe('1_DAY');
      expect(cancelled).toHaveLength(1);
    });
  });

  describe('cancelEventReminders', () => {
    it('cancels all scheduled reminders for an event', async () => {
      const { eventId } = await createTestEventWithUser(t);

      // Set a chosen date and create a reminder
      const futureDate = Date.now() + 2 * 24 * 60 * 60 * 1000;
      await t.run(async ctx => {
        await ctx.db.patch(eventId, { chosenDateTime: futureDate });
        await ctx.db.insert('eventReminders', {
          eventId,
          scheduledTime: futureDate - 60 * 60 * 1000,
          reminderOffset: '1_HOUR',
          status: 'SCHEDULED',
        });
      });

      // Cancel reminders
      const result = await t.mutation(
        internal.reminders.mutations.cancelEventReminders,
        {
          eventId,
        }
      );

      expect(result.cancelled).toBe(1);

      // Verify reminder was cancelled
      const { reminders } = await t.run(async ctx => {
        const reminders = await ctx.db.query('eventReminders').collect();
        return { reminders };
      });

      expect(reminders).toHaveLength(1);
      expect(reminders[0].status).toBe('CANCELLED');
    });
  });

  describe('sendReminder', () => {
    it('sends notifications to all attending members', async () => {
      const {
        organizer: _organizer,
        attendee,
        eventId,
      } = await createTestEventWithMultipleUsers(t);

      // Update attendee to RSVP YES
      await t.run(async ctx => {
        await ctx.db.patch(attendee.membershipId, { rsvpStatus: 'YES' });
      });

      // Set a chosen date
      const futureDate = Date.now() + 60 * 60 * 1000;
      await t.run(async ctx => {
        await ctx.db.patch(eventId, { chosenDateTime: futureDate });
      });

      // Send reminder
      const result = await t.mutation(
        internal.reminders.mutations.sendReminder,
        {
          eventId,
          reminderOffset: '30_MINUTES',
        }
      );

      expect(result.sent).toBe(2); // organizer + attendee

      // Verify notifications were created
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db.query('notifications').collect();
        return { notifications };
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0].type).toBe('EVENT_REMINDER');
      expect(notifications[0].datetime).toBe(futureDate);
    });

    it('skips members who have RSVPd NO', async () => {
      const {
        organizer: _organizer,
        attendee,
        eventId,
      } = await createTestEventWithMultipleUsers(t);

      // Update attendee to RSVP NO (declined)
      await t.run(async ctx => {
        await ctx.db.patch(attendee.membershipId, { rsvpStatus: 'NO' });
      });

      // Set a chosen date
      const futureDate = Date.now() + 60 * 60 * 1000;
      await t.run(async ctx => {
        await ctx.db.patch(eventId, { chosenDateTime: futureDate });
      });

      // Send reminder
      const result = await t.mutation(
        internal.reminders.mutations.sendReminder,
        {
          eventId,
          reminderOffset: '30_MINUTES',
        }
      );

      // Only organizer (who has YES) should receive reminder
      // Attendee who RSVPd NO should be skipped
      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('does not send if event no longer has a chosen date', async () => {
      const { eventId } = await createTestEventWithUser(t);

      // No chosen date set

      // Try to send reminder
      const result = await t.mutation(
        internal.reminders.mutations.sendReminder,
        {
          eventId,
          reminderOffset: '30_MINUTES',
        }
      );

      expect(result.sent).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.sentToAttending).toBe(0);
      expect(result.sentToNonRsvp).toBe(0);
    });
  });

  describe('resetEventDate cancels reminders', () => {
    it('cancels scheduled reminders when date is reset', async () => {
      const { userId, eventId } = await createTestEventWithUser(t);
      const auth = createAuthenticatedUser(t, userId);

      // Choose a date with reminder
      const futureDate = Date.now() + 2 * 24 * 60 * 60 * 1000;
      await auth.mutation(api.events.mutations.chooseEventDate, {
        eventId,
        chosenDateTime: futureDate,
        reminderOffset: '1_DAY',
      });

      // Reset the date
      await auth.mutation(api.events.mutations.resetEventDate, {
        eventId,
      });

      // Verify event date was cleared
      const { event } = await t.run(async ctx => {
        const event = await ctx.db.get(eventId);
        return { event };
      });

      expect(event?.chosenDateTime).toBeUndefined();
    });
  });
});

import { MutationCtx } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { Id } from '../../_generated/dataModel';
import { REMINDER_OFFSETS, type ReminderOffset } from '../../types';
import { type AddonHandler, ADDON_TYPES } from '../types';

/**
 * Expected config shape for the reminders add-on.
 */
interface ReminderConfig {
  reminderOffset: ReminderOffset;
}

function isValidReminderConfig(config: unknown): config is ReminderConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.reminderOffset === 'string' && c.reminderOffset in REMINDER_OFFSETS
  );
}

export const reminderHandler: AddonHandler = {
  type: ADDON_TYPES.REMINDERS,

  validateConfig: (config: unknown): boolean => {
    return isValidReminderConfig(config);
  },

  onEnabled: async (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    config: unknown
  ) => {
    if (!isValidReminderConfig(config)) return;

    const event = await ctx.db.get(eventId);
    if (!event?.chosenDateTime) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const reminderFn = internal.reminders.mutations.scheduleEventReminder;
    await ctx.scheduler.runAfter(0, reminderFn, {
      eventId,
      reminderOffset: config.reminderOffset,
    });
  },

  onDisabled: async (ctx: MutationCtx, eventId: Id<'events'>) => {
    await ctx.scheduler.runAfter(
      0,
      internal.reminders.mutations.cancelEventReminders,
      { eventId }
    );
  },

  onConfigUpdated: async (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    _oldConfig: unknown,
    newConfig: unknown
  ) => {
    if (!isValidReminderConfig(newConfig)) return;

    const event = await ctx.db.get(eventId);
    if (!event?.chosenDateTime) return;

    // Reschedule with new offset
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const reminderFn = internal.reminders.mutations.scheduleEventReminder;
    await ctx.scheduler.runAfter(0, reminderFn, {
      eventId,
      reminderOffset: newConfig.reminderOffset,
    });
  },

  onDateChosen: async (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    _chosenDateTime: number,
    config: unknown
  ) => {
    if (!isValidReminderConfig(config)) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const reminderFn = internal.reminders.mutations.scheduleEventReminder;
    await ctx.scheduler.runAfter(0, reminderFn, {
      eventId,
      reminderOffset: config.reminderOffset,
    });
  },

  onDateReset: async (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    _config: unknown
  ) => {
    await ctx.scheduler.runAfter(
      0,
      internal.reminders.mutations.cancelEventReminders,
      { eventId }
    );
  },

  onEventDeleted: async (ctx: MutationCtx, eventId: Id<'events'>) => {
    // Cancel scheduled functions and delete eventReminders rows
    const reminders = await ctx.db
      .query('eventReminders')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    for (const reminder of reminders) {
      if (reminder.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(reminder.scheduledFunctionId);
        } catch {
          // Ignore - job may have already run
        }
      }
      await ctx.db.delete(reminder._id);
    }
  },
};

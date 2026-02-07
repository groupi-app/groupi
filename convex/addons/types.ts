import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

/**
 * Registered add-on type identifiers.
 * Expand this as new add-ons are added.
 */
export const ADDON_TYPES = {
  REMINDERS: 'reminders',
  QUESTIONNAIRE: 'questionnaire',
  BRING_LIST: 'bring-list',
} as const;

export type AddonType = (typeof ADDON_TYPES)[keyof typeof ADDON_TYPES];

/**
 * Lifecycle events that add-on handlers can respond to.
 *
 * The same interface is used for both first-party (in-process) and
 * future user add-ons (webhook dispatch). First-party handlers receive
 * the full MutationCtx; user add-on handlers will receive a
 * capability-scoped wrapper over the same lifecycle surface.
 */
export interface AddonHandler {
  /** Must match a key in ADDON_TYPES */
  type: AddonType;

  /** Validate the config object before persisting. Return false to reject. */
  validateConfig: (config: unknown) => boolean;

  /** Called when the add-on is enabled for an event. */
  onEnabled?: (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    config: unknown
  ) => Promise<void>;

  /** Called when the add-on is disabled for an event. */
  onDisabled?: (ctx: MutationCtx, eventId: Id<'events'>) => Promise<void>;

  /** Called when the add-on config is updated (already enabled). */
  onConfigUpdated?: (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    oldConfig: unknown,
    newConfig: unknown
  ) => Promise<void>;

  /** Called when an event's date is chosen/changed. */
  onDateChosen?: (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    chosenDateTime: number,
    config: unknown
  ) => Promise<void>;

  /** Called when an event's date is reset (cleared). */
  onDateReset?: (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    config: unknown
  ) => Promise<void>;

  /** Called when an event is deleted. Clean up addon-specific data. */
  onEventDeleted?: (ctx: MutationCtx, eventId: Id<'events'>) => Promise<void>;
}

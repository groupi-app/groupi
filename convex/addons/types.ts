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
  DISCORD: 'discord',
  CUSTOM: '__custom__',
} as const;

export type AddonType = (typeof ADDON_TYPES)[keyof typeof ADDON_TYPES];

/**
 * @deprecated Use `defineAddonHandler()` from `convex/addons/define.ts` instead.
 *
 * This interface is kept for reference only. All handlers should be
 * migrated to the builder pattern which provides:
 * - Runtime validation at definition time
 * - Scoped `AddonContext` instead of raw `MutationCtx`
 * - Brand checking to prevent forged handler objects
 * - Automatic try/catch wrapping for `validateConfig`
 *
 * @see defineAddonHandler in `convex/addons/define.ts`
 * @see AddonContext in `convex/addons/context.ts`
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

  /** Called when an event's details are updated (title, description, location, etc). */
  onEventUpdated?: (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    config: unknown
  ) => Promise<void>;

  /** Called when an event is deleted. Clean up addon-specific data. */
  onEventDeleted?: (ctx: MutationCtx, eventId: Id<'events'>) => Promise<void>;
}

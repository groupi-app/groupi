import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { getAddonHandler } from './registry';
import { createAddonContext, createTrustedAddonContext } from './context';
import type { AnyDefinedHandler } from './define';
import type { AddonContext } from './context';

/**
 * Lifecycle event names that can be dispatched to add-on handlers.
 */
type LifecycleEvent =
  | 'onEnabled'
  | 'onDisabled'
  | 'onConfigUpdated'
  | 'onDateChosen'
  | 'onDateReset'
  | 'onEventUpdated'
  | 'onEventDeleted'
  | 'onDataSubmitted'
  | 'onMemberJoined'
  | 'onMemberLeft';

/**
 * Build the appropriate scoped context for a handler.
 * Trusted handlers get TrustedAddonContext (with rawCtx).
 * Standard handlers get AddonContext (restricted).
 *
 * @param addonType - The actual addon type string stored in the database,
 *   which may differ from handler.type for shared handlers (e.g., custom
 *   addons use `custom:{templateId}` but share the `__custom__` handler).
 */
function buildContext(
  ctx: MutationCtx,
  handler: AnyDefinedHandler,
  eventId: Id<'events'>,
  addonType: string
): AddonContext {
  if (handler.trusted) {
    return createTrustedAddonContext(ctx, addonType, eventId);
  }
  return createAddonContext(ctx, addonType, eventId);
}

/**
 * Dispatch a lifecycle event to ALL enabled add-ons for an event.
 *
 * Reads `eventAddonConfigs` for the event, finds handlers, and calls
 * the appropriate lifecycle method on each.
 */
export async function dispatchAddonLifecycle(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  event: LifecycleEvent,
  args?: {
    chosenDateTime?: number;
    personId?: Id<'persons'>;
    key?: string;
    data?: unknown;
    submitterId?: Id<'persons'>;
  }
): Promise<void> {
  const addonConfigs = await ctx.db
    .query('eventAddonConfigs')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  for (const addonConfig of addonConfigs) {
    if (!addonConfig.enabled) continue;

    const handler = getAddonHandler(addonConfig.addonType);
    if (!handler) continue;

    const addonCtx = buildContext(ctx, handler, eventId, addonConfig.addonType);

    await dispatchToHandler(
      handler,
      addonCtx,
      event,
      addonConfig.config,
      undefined,
      args
    );
  }
}

/**
 * Dispatch a lifecycle event to a SINGLE specific add-on.
 * Used when enabling/disabling/updating a specific add-on.
 */
export async function dispatchSingleAddonLifecycle(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  addonType: string,
  event: LifecycleEvent,
  config?: unknown,
  oldConfig?: unknown,
  args?: {
    chosenDateTime?: number;
    personId?: Id<'persons'>;
    key?: string;
    data?: unknown;
    submitterId?: Id<'persons'>;
  }
): Promise<void> {
  const handler = getAddonHandler(addonType);
  if (!handler) return;

  const addonCtx = buildContext(ctx, handler, eventId, addonType);

  await dispatchToHandler(handler, addonCtx, event, config, oldConfig, args);
}

async function dispatchToHandler(
  handler: AnyDefinedHandler,
  addonCtx: AddonContext,
  event: LifecycleEvent,
  config?: unknown,
  oldConfig?: unknown,
  args?: {
    chosenDateTime?: number;
    personId?: Id<'persons'>;
    key?: string;
    data?: unknown;
    submitterId?: Id<'persons'>;
  }
): Promise<void> {
  switch (event) {
    case 'onEnabled':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (handler.onEnabled as any)?.(addonCtx, config);
      break;
    case 'onDisabled':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (handler.onDisabled as any)?.(addonCtx);
      break;
    case 'onConfigUpdated':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (handler.onConfigUpdated as any)?.(addonCtx, oldConfig, config);
      break;
    case 'onDateChosen':
      if (args?.chosenDateTime) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (handler.onDateChosen as any)?.(
          addonCtx,
          args.chosenDateTime,
          config
        );
      }
      break;
    case 'onDateReset':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (handler.onDateReset as any)?.(addonCtx, config);
      break;
    case 'onEventUpdated':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (handler.onEventUpdated as any)?.(addonCtx, config);
      break;
    case 'onEventDeleted':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (handler.onEventDeleted as any)?.(addonCtx);
      break;
    case 'onDataSubmitted':
      if (args?.key && args.submitterId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (handler.onDataSubmitted as any)?.(
          addonCtx,
          args.key,
          args.data,
          args.submitterId
        );
      }
      break;
    case 'onMemberJoined':
      if (args?.personId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (handler.onMemberJoined as any)?.(addonCtx, args.personId);
      }
      break;
    case 'onMemberLeft':
      if (args?.personId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (handler.onMemberLeft as any)?.(addonCtx, args.personId);
      }
      break;
  }
}

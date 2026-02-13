import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { getAddonHandler } from './registry';

/**
 * Lifecycle event names that can be dispatched to add-on handlers.
 */
type LifecycleEvent =
  | 'onEnabled'
  | 'onDisabled'
  | 'onConfigUpdated'
  | 'onDateChosen'
  | 'onDateReset'
  | 'onEventDeleted';

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
  args?: { chosenDateTime?: number }
): Promise<void> {
  const addonConfigs = await ctx.db
    .query('eventAddonConfigs')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  for (const addonConfig of addonConfigs) {
    if (!addonConfig.enabled) continue;

    const handler = getAddonHandler(addonConfig.addonType);
    if (!handler) continue;

    await dispatchToHandler(
      ctx,
      handler,
      eventId,
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
  args?: { chosenDateTime?: number }
): Promise<void> {
  const handler = getAddonHandler(addonType);
  if (!handler) return;

  await dispatchToHandler(
    ctx,
    handler,
    eventId,
    event,
    config,
    oldConfig,
    args
  );
}

async function dispatchToHandler(
  ctx: MutationCtx,
  handler: ReturnType<typeof getAddonHandler>,
  eventId: Id<'events'>,
  event: LifecycleEvent,
  config?: unknown,
  oldConfig?: unknown,
  args?: { chosenDateTime?: number }
): Promise<void> {
  if (!handler) return;

  switch (event) {
    case 'onEnabled':
      await handler.onEnabled?.(ctx, eventId, config);
      break;
    case 'onDisabled':
      await handler.onDisabled?.(ctx, eventId);
      break;
    case 'onConfigUpdated':
      await handler.onConfigUpdated?.(ctx, eventId, oldConfig, config);
      break;
    case 'onDateChosen':
      if (args?.chosenDateTime) {
        await handler.onDateChosen?.(ctx, eventId, args.chosenDateTime, config);
      }
      break;
    case 'onDateReset':
      await handler.onDateReset?.(ctx, eventId, config);
      break;
    case 'onEventDeleted':
      await handler.onEventDeleted?.(ctx, eventId);
      break;
  }
}

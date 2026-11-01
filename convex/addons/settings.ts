import { ConvexError, type Infer } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { addonConfig } from './contracts';
import { requireWriteRole } from '../events/writes';
import { getAddonHandler } from './registry';
import { dispatchSingleAddonLifecycle } from './lifecycle';
import { requireDiscordGuildAuthorization } from '../discord/authorization';
import { ADDON_TYPES } from './types';
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (
    a &&
    b &&
    typeof a === 'object' &&
    typeof b === 'object' &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const x = a as Record<string, unknown>,
      y = b as Record<string, unknown>,
      keys = Object.keys(x);
    return (
      keys.length === Object.keys(y).length &&
      keys.every(
        k => Object.prototype.hasOwnProperty.call(y, k) && same(x[k], y[k])
      )
    );
  }
  return false;
}
export async function saveSettingsAddons(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  changes: Array<{
    addonType: string;
    enabled: boolean;
    config: Infer<typeof addonConfig>;
    confirmedDestructive?: boolean;
  }>
) {
  await requireWriteRole(ctx, eventId, personId, 'MODERATOR');
  if (
    changes.length > 100 ||
    new Set(changes.map(c => c.addonType)).size !== changes.length
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Choose distinct supported add-ons.',
    });
  for (const change of changes) {
    if (
      !new Set<string>([
        ADDON_TYPES.REMINDERS,
        ADDON_TYPES.QUESTIONNAIRE,
        ADDON_TYPES.BRING_LIST,
        ADDON_TYPES.DISCORD,
      ]).has(change.addonType) &&
      !change.addonType.startsWith('custom:')
    )
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'This add-on uses its own configuration flow.',
      });
    const handler = getAddonHandler(change.addonType);
    if (
      change.enabled &&
      (!handler?.validateConfig(change.config) ||
        new TextEncoder().encode(JSON.stringify(change.config)).length >
          64 * 1024)
    )
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid add-on settings.',
      });
    const row = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', change.addonType)
      )
      .first();
    const changed = !same(row?.config, change.config);
    if (
      row?.enabled &&
      (!change.enabled ||
        (changed && change.addonType !== ADDON_TYPES.REMINDERS)) &&
      !change.confirmedDestructive
    )
      throw new ConvexError({
        code: 'CONFLICT',
        message: 'Confirm this add-on reset separately before saving.',
      });
    const now = Date.now();
    if (!change.enabled) {
      if (row?.enabled) {
        await ctx.db.patch(row._id, { enabled: false, updatedAt: now });
        await dispatchSingleAddonLifecycle(
          ctx,
          eventId,
          change.addonType,
          'onDisabled'
        );
      }
      continue;
    }
    if (row?.enabled && !changed) continue;
    await requireDiscordGuildAuthorization(
      ctx,
      personId,
      change.addonType,
      change.config
    );

    if (row)
      await ctx.db.patch(row._id, {
        enabled: true,
        config: change.config,
        updatedAt: now,
      });
    else
      await ctx.db.insert('eventAddonConfigs', {
        eventId,
        addonType: change.addonType,
        enabled: true,
        config: change.config,
        createdAt: now,
        updatedAt: now,
      });
    await dispatchSingleAddonLifecycle(
      ctx,
      eventId,
      change.addonType,
      row?.enabled ? 'onConfigUpdated' : 'onEnabled',
      change.config,
      row?.config
    );
  }
}

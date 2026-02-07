import { MutationCtx } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';
import { type AddonHandler, ADDON_TYPES } from '../types';
import { notifyEventMembers } from '../../lib/notifications';
import { requireAuth } from '../../auth';

interface BringListItem {
  id: string;
  name: string;
  quantity: number;
}

interface BringListConfig {
  items: BringListItem[];
}

function isValidBringListConfig(config: unknown): config is BringListConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;

  if (!Array.isArray(c.items) || c.items.length === 0) return false;

  for (const item of c.items) {
    if (typeof item !== 'object' || item === null) return false;
    const i = item as Record<string, unknown>;

    if (typeof i.id !== 'string' || i.id.length === 0) return false;
    if (typeof i.name !== 'string' || i.name.length === 0) return false;
    if (typeof i.quantity !== 'number' || i.quantity < 1) return false;
  }

  return true;
}

/**
 * Delete all addonData rows for a given event+addonType.
 */
async function clearAllClaims(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  addonType: string
) {
  const entries = await ctx.db
    .query('addonData')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', eventId).eq('addonType', addonType)
    )
    .collect();

  for (const entry of entries) {
    await ctx.db.delete(entry._id);
  }
}

export const bringListHandler: AddonHandler = {
  type: ADDON_TYPES.BRING_LIST,

  validateConfig: (config: unknown): boolean => {
    return isValidBringListConfig(config);
  },

  onConfigUpdated: async (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    _oldConfig: unknown,
    _newConfig: unknown
  ) => {
    // Clear all existing claims when config changes
    await clearAllClaims(ctx, eventId, ADDON_TYPES.BRING_LIST);

    // Notify members that claims were cleared
    const { person } = await requireAuth(ctx);
    await notifyEventMembers(ctx, {
      eventId,
      type: 'ADDON_CONFIG_RESET',
      authorId: person._id,
    });
  },

  onDisabled: async (ctx: MutationCtx, eventId: Id<'events'>) => {
    await clearAllClaims(ctx, eventId, ADDON_TYPES.BRING_LIST);
  },

  onEventDeleted: async (ctx: MutationCtx, eventId: Id<'events'>) => {
    await clearAllClaims(ctx, eventId, ADDON_TYPES.BRING_LIST);
  },
};

import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';

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

export const bringListHandler = defineAddonHandler({
  type: ADDON_TYPES.BRING_LIST,

  validateConfig: isValidBringListConfig,

  onConfigUpdated: async (ctx, _oldConfig, _newConfig) => {
    // Clear all existing claims when config changes
    await ctx.deleteAllAddonData();

    // Notify members that claims were cleared
    const person = await ctx.getAuthPerson();
    if (person) {
      await ctx.notifyEventMembers({
        type: 'ADDON_CONFIG_RESET',
        authorId: person._id,
      });
    }
  },

  onDisabled: async ctx => {
    await ctx.deleteAllAddonData();
  },

  onEventDeleted: async ctx => {
    await ctx.deleteAllAddonData();
  },
});

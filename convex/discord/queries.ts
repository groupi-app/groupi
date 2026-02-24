import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireEventMembership } from '../auth';

/**
 * Get the Discord event info for an event.
 * Returns the guild ID, Discord event ID, and sync timestamp.
 * Any event member can call this.
 */
export const getDiscordEventInfo = query({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    await requireEventMembership(ctx, eventId);

    const entry = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', 'discord')
          .eq('key', 'discord-event')
      )
      .first();

    // Check for errors
    const errorEntry = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', 'discord')
          .eq('key', 'discord-error')
      )
      .first();

    // Get the guild name from the addon config
    const addonConfig = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', 'discord')
      )
      .first();

    const config = addonConfig?.config as {
      guildId: string;
      guildName: string;
    } | null;

    if (!entry) {
      // No discord event, but check if there's an error to report
      if (errorEntry) {
        const errorData = errorEntry.data as {
          error: string;
          occurredAt: number;
        };
        return {
          discordEventId: null,
          guildId: config?.guildId ?? null,
          guildName: config?.guildName ?? null,
          syncedAt: null,
          error: errorData.error,
        };
      }
      return null;
    }

    const data = entry.data as {
      discordEventId: string;
      guildId: string;
      syncedAt: number;
    };

    return {
      discordEventId: data.discordEventId,
      guildId: data.guildId,
      guildName: config?.guildName ?? null,
      syncedAt: data.syncedAt,
      error: null,
    };
  },
});

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Store the Discord event ID in addonData for an event.
 * Called by Discord actions after creating/updating a Discord event.
 */
export const storeDiscordEventId = internalMutation({
  args: {
    eventId: v.id('events'),
    discordEventId: v.string(),
    guildId: v.string(),
  },
  handler: async (ctx, { eventId, discordEventId, guildId }) => {
    const existing = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', 'discord')
          .eq('key', 'discord-event')
      )
      .first();

    const now = Date.now();
    const data = { discordEventId, guildId, syncedAt: now };

    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now });
    } else {
      // Use a system-level creator ID since this is called from internal actions
      // Find the event creator to use as the createdBy
      const event = await ctx.db.get(eventId);
      const creatorId = event?.creatorId;

      if (!creatorId) return;

      await ctx.db.insert('addonData', {
        eventId,
        addonType: 'discord',
        key: 'discord-event',
        data,
        createdBy: creatorId,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Store an error from a failed Discord API call.
 * Allows the frontend to display the failure instead of showing "Syncing..." forever.
 */
export const storeDiscordError = internalMutation({
  args: {
    eventId: v.id('events'),
    error: v.string(),
  },
  handler: async (ctx, { eventId, error }) => {
    const existing = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', 'discord')
          .eq('key', 'discord-error')
      )
      .first();

    const now = Date.now();
    const data = { error, occurredAt: now };

    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now });
    } else {
      const event = await ctx.db.get(eventId);
      const creatorId = event?.creatorId;
      if (!creatorId) return;

      await ctx.db.insert('addonData', {
        eventId,
        addonType: 'discord',
        key: 'discord-error',
        data,
        createdBy: creatorId,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Clear any stored Discord error.
 * Called when a Discord operation succeeds.
 */
export const clearDiscordError = internalMutation({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const existing = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', 'discord')
          .eq('key', 'discord-error')
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Clear the stored Discord event ID from addonData.
 * Called by Discord actions after deleting a Discord event.
 */
export const clearDiscordEventId = internalMutation({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const existing = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', 'discord')
          .eq('key', 'discord-event')
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * Replace the caller's short-lived guild authorization records after a fresh
 * Discord API guild fetch.
 */
export const replaceGuildAuthorizations = internalMutation({
  args: {
    guilds: v.array(
      v.object({
        guildId: v.string(),
        guildName: v.string(),
        botInstalled: v.boolean(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, { guilds }) => {
    const { person } = await requireAuth(ctx);
    const existing = await ctx.db
      .query('discordGuildAuthorizations')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    await Promise.all(existing.map(record => ctx.db.delete(record._id)));

    const authorizedAt = Date.now();
    await Promise.all(
      guilds.map(guild =>
        ctx.db.insert('discordGuildAuthorizations', {
          personId: person._id,
          guildId: guild.guildId,
          guildName: guild.guildName,
          botInstalled: guild.botInstalled,
          authorizedAt,
        })
      )
    );

    return null;
  },
});

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

import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';

// Use require to avoid deep type instantiation errors with internal references
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internalApi: any = require('../../_generated/api').internal;

interface DiscordConfig {
  guildId: string;
  guildName: string;
}

function isValidDiscordConfig(config: unknown): config is DiscordConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.guildId === 'string' &&
    c.guildId.length > 0 &&
    typeof c.guildName === 'string' &&
    c.guildName.length > 0
  );
}

export const discordHandler = defineAddonHandler({
  type: ADDON_TYPES.DISCORD,
  trusted: true,

  validateConfig: isValidDiscordConfig,

  onEnabled: async (ctx, config) => {
    if (!isValidDiscordConfig(config)) return;

    // Only create Discord event if a date is already chosen
    const event = await ctx.getEvent();
    if (!event?.chosenDateTime) return;

    await ctx.rawCtx.scheduler.runAfter(
      0,
      internalApi.discord.actions.createDiscordEvent,
      { guildId: config.guildId, eventId: ctx.eventId }
    );
  },

  onDisabled: async ctx => {
    const discordData = await ctx.getAddonDataByKey('discord-event');
    if (discordData) {
      const data = discordData.data as {
        discordEventId: string;
        guildId: string;
      };
      await ctx.rawCtx.scheduler.runAfter(
        0,
        internalApi.discord.actions.deleteDiscordEvent,
        {
          guildId: data.guildId,
          discordEventId: data.discordEventId,
          eventId: ctx.eventId,
        }
      );
    }
  },

  onConfigUpdated: async (ctx, oldConfig, newConfig) => {
    if (!isValidDiscordConfig(oldConfig) || !isValidDiscordConfig(newConfig))
      return;

    // If guild changed, delete old event and create new one
    if (oldConfig.guildId !== newConfig.guildId) {
      const discordData = await ctx.getAddonDataByKey('discord-event');
      if (discordData) {
        const data = discordData.data as {
          discordEventId: string;
          guildId: string;
        };
        await ctx.rawCtx.scheduler.runAfter(
          0,
          internalApi.discord.actions.deleteDiscordEvent,
          {
            guildId: data.guildId,
            discordEventId: data.discordEventId,
            eventId: ctx.eventId,
          }
        );
      }

      // Create in new guild if date is set
      const event = await ctx.getEvent();
      if (event?.chosenDateTime) {
        await ctx.rawCtx.scheduler.runAfter(
          0,
          internalApi.discord.actions.createDiscordEvent,
          { guildId: newConfig.guildId, eventId: ctx.eventId }
        );
      }
    }
  },

  onDateChosen: async (ctx, _chosenDateTime, config) => {
    if (!isValidDiscordConfig(config)) return;

    const discordData = await ctx.getAddonDataByKey('discord-event');
    if (discordData) {
      const data = discordData.data as {
        discordEventId: string;
        guildId: string;
      };
      // Update existing Discord event with new date
      await ctx.rawCtx.scheduler.runAfter(
        0,
        internalApi.discord.actions.updateDiscordEvent,
        {
          guildId: data.guildId,
          discordEventId: data.discordEventId,
          eventId: ctx.eventId,
        }
      );
    } else {
      // Create Discord event now that we have a date
      await ctx.rawCtx.scheduler.runAfter(
        0,
        internalApi.discord.actions.createDiscordEvent,
        { guildId: config.guildId, eventId: ctx.eventId }
      );
    }
  },

  onDateReset: async (ctx, _config) => {
    // Can't have a Discord scheduled event without a date
    const discordData = await ctx.getAddonDataByKey('discord-event');
    if (discordData) {
      const data = discordData.data as {
        discordEventId: string;
        guildId: string;
      };
      await ctx.rawCtx.scheduler.runAfter(
        0,
        internalApi.discord.actions.deleteDiscordEvent,
        {
          guildId: data.guildId,
          discordEventId: data.discordEventId,
          eventId: ctx.eventId,
        }
      );
    }
  },

  onEventUpdated: async (ctx, _config) => {
    const discordData = await ctx.getAddonDataByKey('discord-event');
    if (discordData) {
      const data = discordData.data as {
        discordEventId: string;
        guildId: string;
      };
      await ctx.rawCtx.scheduler.runAfter(
        0,
        internalApi.discord.actions.updateDiscordEvent,
        {
          guildId: data.guildId,
          discordEventId: data.discordEventId,
          eventId: ctx.eventId,
        }
      );
    }
  },

  onEventDeleted: async ctx => {
    const discordData = await ctx.getAddonDataByKey('discord-event');
    if (discordData) {
      const data = discordData.data as {
        discordEventId: string;
        guildId: string;
      };
      await ctx.rawCtx.scheduler.runAfter(
        0,
        internalApi.discord.actions.deleteDiscordEvent,
        {
          guildId: data.guildId,
          discordEventId: data.discordEventId,
          eventId: ctx.eventId,
        }
      );
    }
    // Clear all addon data
    await ctx.deleteAllAddonData();
  },
});

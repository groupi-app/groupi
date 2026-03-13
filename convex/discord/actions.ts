'use node';

import { action, internalAction } from '../_generated/server';
import { v } from 'convex/values';

// Use require to avoid deep type instantiation errors with internal references
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internalApi: any = require('../_generated/api').internal;

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Build the Discord event description with a Groupi link appended.
 */
function buildDescription(description: string | undefined, eventId: string) {
  const siteUrl = process.env.SITE_URL || 'https://groupi.gg';
  const groupiLink = `${siteUrl}/event/${eventId}`;
  const suffix = `\n\nView on Groupi: ${groupiLink}`;
  const base = description?.trim() || '';
  return base ? `${base}${suffix}` : `View on Groupi: ${groupiLink}`;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

interface DiscordGuildWithPermissions extends DiscordGuild {
  permissions: string;
}

interface GuildResult {
  available: DiscordGuild[];
  invitable: DiscordGuild[];
}

// MANAGE_GUILD permission bit (1 << 5 = 0x20)
const MANAGE_GUILD = 0x20;

/**
 * Get guilds available for the Discord addon.
 * Returns two lists:
 * - available: guilds where both user and bot are present (can select)
 * - invitable: guilds where user has MANAGE_GUILD but bot is not present (can invite bot)
 */
export const getAvailableGuilds = action({
  args: {},
  handler: async (ctx): Promise<GuildResult> => {
    const empty: GuildResult = { available: [], invitable: [] };
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[Discord] DISCORD_BOT_TOKEN not configured');
      return empty;
    }

    // Get the current user's Discord access token
    const data = await ctx.runQuery(
      internalApi.accounts.queries.getAccountsWithTokens,
      {}
    );

    if (!data.user) {
      return empty;
    }

    const discordAccount = data.accounts.find(
      (a: { providerId: string }) => a.providerId === 'discord'
    );

    if (!discordAccount?.accessToken) {
      return empty;
    }

    // Fetch user's guilds (includes permissions)
    const userGuildsRes = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${discordAccount.accessToken}` },
    });

    if (!userGuildsRes.ok) {
      console.error(
        '[Discord] Failed to fetch user guilds:',
        userGuildsRes.status
      );
      return empty;
    }

    const userGuilds: DiscordGuildWithPermissions[] =
      await userGuildsRes.json();

    // Fetch bot's guilds
    const botGuildsRes = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!botGuildsRes.ok) {
      console.error(
        '[Discord] Failed to fetch bot guilds:',
        botGuildsRes.status
      );
      return empty;
    }

    const botGuilds: DiscordGuild[] = await botGuildsRes.json();
    const botGuildIds = new Set(botGuilds.map(g => g.id));

    const available: DiscordGuild[] = [];
    const invitable: DiscordGuild[] = [];

    for (const g of userGuilds) {
      const guild = { id: g.id, name: g.name, icon: g.icon };
      if (botGuildIds.has(g.id)) {
        available.push(guild);
      } else if (Number(g.permissions) & MANAGE_GUILD) {
        // User can manage this guild — show it as invitable
        invitable.push(guild);
      }
    }

    return { available, invitable };
  },
});

/**
 * Create a Discord Scheduled Event for a Groupi event.
 * Called via scheduler from the addon handler.
 */
export const createDiscordEvent = internalAction({
  args: {
    guildId: v.string(),
    eventId: v.id('events'),
  },
  handler: async (ctx, { guildId, eventId }) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[Discord] DISCORD_BOT_TOKEN not configured');
      return;
    }

    // Read event data
    const event = await ctx.runQuery(internalApi.events.queries.getEventById, {
      eventId,
    });

    if (!event || !event.chosenDateTime) {
      console.error('[Discord] Event not found or no chosen date:', eventId);
      return;
    }

    const startTime = new Date(event.chosenDateTime).toISOString();
    // Default to start + 2h if no end time
    const endTime = event.chosenEndDateTime
      ? new Date(event.chosenEndDateTime).toISOString()
      : new Date(event.chosenDateTime + 2 * 60 * 60 * 1000).toISOString();

    const body = {
      name: event.title,
      description: buildDescription(event.description, eventId),
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      privacy_level: 2, // GUILD_ONLY
      entity_type: 3, // EXTERNAL
      entity_metadata: {
        location: event.location || 'TBD',
      },
    };

    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/scheduled-events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[Discord] Failed to create event:', res.status, text);

      // Parse Discord error for a user-friendly message
      let errorMsg = `Discord API error (${res.status})`;
      try {
        const parsed = JSON.parse(text);
        if (parsed.message) {
          errorMsg = parsed.message;
        }
      } catch {
        // Use default message
      }

      await ctx.runMutation(internalApi.discord.mutations.storeDiscordError, {
        eventId,
        error: errorMsg,
      });
      return;
    }

    const discordEvent = await res.json();

    // Store the Discord event ID and clear any previous error
    await ctx.runMutation(internalApi.discord.mutations.storeDiscordEventId, {
      eventId,
      discordEventId: discordEvent.id,
      guildId,
    });
    await ctx.runMutation(internalApi.discord.mutations.clearDiscordError, {
      eventId,
    });

    console.log(
      `[Discord] Created event ${discordEvent.id} in guild ${guildId}`
    );
  },
});

/**
 * Update an existing Discord Scheduled Event.
 */
export const updateDiscordEvent = internalAction({
  args: {
    guildId: v.string(),
    discordEventId: v.string(),
    eventId: v.id('events'),
  },
  handler: async (ctx, { guildId, discordEventId, eventId }) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[Discord] DISCORD_BOT_TOKEN not configured');
      return;
    }

    const event = await ctx.runQuery(internalApi.events.queries.getEventById, {
      eventId,
    });

    if (!event) {
      console.error('[Discord] Event not found:', eventId);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = {
      name: event.title,
      description: buildDescription(event.description, eventId),
      entity_metadata: {
        location: event.location || 'TBD',
      },
    };

    if (event.chosenDateTime) {
      body.scheduled_start_time = new Date(event.chosenDateTime).toISOString();
      body.scheduled_end_time = event.chosenEndDateTime
        ? new Date(event.chosenEndDateTime).toISOString()
        : new Date(event.chosenDateTime + 2 * 60 * 60 * 1000).toISOString();
    }

    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/scheduled-events/${discordEventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[Discord] Failed to update event:', res.status, text);
      return;
    }

    // Update sync timestamp
    await ctx.runMutation(internalApi.discord.mutations.storeDiscordEventId, {
      eventId,
      discordEventId,
      guildId,
    });

    console.log(`[Discord] Updated event ${discordEventId}`);
  },
});

/**
 * Delete a Discord Scheduled Event.
 */
export const deleteDiscordEvent = internalAction({
  args: {
    guildId: v.string(),
    discordEventId: v.string(),
    eventId: v.id('events'),
  },
  handler: async (ctx, { guildId, discordEventId, eventId }) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[Discord] DISCORD_BOT_TOKEN not configured');
      return;
    }

    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/scheduled-events/${discordEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      console.error('[Discord] Failed to delete event:', res.status, text);
    }

    // Clear stored Discord event ID
    await ctx.runMutation(internalApi.discord.mutations.clearDiscordEventId, {
      eventId,
    });

    console.log(`[Discord] Deleted event ${discordEventId}`);
  },
});

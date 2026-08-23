import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

const AUTHORIZATION_MAX_AGE_MS = 15 * 60 * 1000;

interface DiscordConfig {
  guildId: string;
  guildName: string;
}

function getDiscordConfig(config: unknown): DiscordConfig | null {
  if (typeof config !== 'object' || config === null) return null;

  const candidate = config as Record<string, unknown>;
  if (
    typeof candidate.guildId !== 'string' ||
    typeof candidate.guildName !== 'string'
  ) {
    return null;
  }

  return {
    guildId: candidate.guildId,
    guildName: candidate.guildName,
  };
}

/**
 * Require a recent Discord API authorization for a selected guild.
 * The authorization is written only by getAvailableGuilds after Discord
 * confirms the caller has MANAGE_GUILD and the bot is installed.
 */
export async function requireDiscordGuildAuthorization(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  addonType: string,
  config: unknown
): Promise<void> {
  if (addonType !== 'discord') return;

  const discordConfig = getDiscordConfig(config);
  if (!discordConfig) {
    throw new Error('Invalid config for add-on: discord');
  }

  const authorization = await ctx.db
    .query('discordGuildAuthorizations')
    .withIndex('by_person_guild', q =>
      q.eq('personId', personId).eq('guildId', discordConfig.guildId)
    )
    .first();

  const isFresh =
    authorization !== null &&
    Date.now() - authorization.authorizedAt <= AUTHORIZATION_MAX_AGE_MS;

  if (
    !authorization ||
    !authorization.botInstalled ||
    !isFresh ||
    authorization.guildName !== discordConfig.guildName
  ) {
    throw new Error(
      'Discord server authorization expired or missing. Refresh the Discord server list and try again.'
    );
  }
}

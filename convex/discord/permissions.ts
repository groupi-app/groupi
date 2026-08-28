export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordGuildWithPermissions extends DiscordGuild {
  permissions: string;
}

export interface GuildResult {
  available: DiscordGuild[];
  invitable: DiscordGuild[];
}

// MANAGE_GUILD permission bit (1 << 5 = 0x20). Discord returns permission
// bitfields as decimal strings, so use BigInt to avoid precision loss.
const MANAGE_GUILD = 1n << 5n;

export function hasManageGuildPermission(permissions: string): boolean {
  try {
    return (BigInt(permissions) & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

export function partitionManageableGuilds(
  userGuilds: DiscordGuildWithPermissions[],
  botGuildIds: ReadonlySet<string>
): GuildResult {
  const available: DiscordGuild[] = [];
  const invitable: DiscordGuild[] = [];

  for (const guildWithPermissions of userGuilds) {
    if (!hasManageGuildPermission(guildWithPermissions.permissions)) continue;

    const guild = {
      id: guildWithPermissions.id,
      name: guildWithPermissions.name,
      icon: guildWithPermissions.icon,
    };

    if (botGuildIds.has(guild.id)) {
      available.push(guild);
    } else {
      invitable.push(guild);
    }
  }

  return { available, invitable };
}

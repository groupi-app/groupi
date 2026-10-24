'use node';
import {
  memberCapabilities,
  hasPermissions,
  DISCORD_PERMISSIONS,
} from './permissions';
import { action, type ActionCtx } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { v, type Infer } from 'convex/values';
import { fetchDiscordUserApi } from '../discord/userApi';
import { hasManageGuildPermission } from '../discord/permissions';
import { mode, connection } from './contracts';
type Role = {
  id: string;
  name: string;
  permissions: string;
  position: number;
  managed?: boolean;
};
import { MEMBER_PERMISSIONS, roleAbove } from './permissions';
import { discordBot } from './provider';

/** Build only Discord's fixed public CDN path from verified provider metadata.
 * Existing records remain iconless until a metadata refresh or fresh setup.
 */
function verifiedGuildIconUrl(guildId: string, icon: unknown) {
  if (
    !/^[0-9]{1,20}$/.test(guildId) ||
    typeof icon !== 'string' ||
    !/^(?:a_)?[a-fA-F0-9]{32}$/.test(icon)
  )
    return undefined;
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`;
}

async function manageableGuild(ctx: ActionCtx, guildId: string) {
  const data = await ctx.runQuery(
    internal.accounts.queries.getAccountsForEnrichment,
    {}
  );
  const account = data.accounts.find(a => a.providerId === 'discord');
  if (!account)
    throw new Error(
      'Link a Discord account before configuring this connection.'
    );
  const guildResponse = await fetchDiscordUserApi(
    ctx,
    account.accountId,
    '/users/@me/guilds'
  );
  if (!guildResponse.ok)
    throw new Error(
      'Discord server authorization failed. Relink Discord and try again.'
    );
  const guilds: {
    id: string;
    name: string;
    icon?: string | null;
    permissions: string;
    owner?: boolean;
  }[] = await guildResponse.json();
  const guild = guilds.find(g => g.id === guildId);
  if (
    !guild ||
    (!guild.owner &&
      (BigInt(guild.permissions) & 8n) === 0n &&
      !hasManageGuildPermission(guild.permissions))
  )
    throw new Error('Discord Manage Server authority is required.');
  return guild;
}

export const configure = action({
  args: {
    groupId: v.id('groups'),
    guildId: v.string(),
    mode: v.optional(mode),
    roleId: v.optional(v.string()),
    landingChannelId: v.optional(v.string()),
  },
  returns: connection,
  handler: async (ctx, args): Promise<Infer<typeof connection>> => {
    const manager = await ctx.runQuery(
      internal.groupDiscord.queries.managerContext,
      { groupId: args.groupId }
    );
    const guild = await manageableGuild(ctx, args.guildId);
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken)
      throw new Error(
        'Discord bot is unavailable. Contact the Groupi administrator.'
      );
    async function bot(path: string, init: RequestInit = {}) {
      const response = await discordBot(ctx, path, {
        ...init,
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? 'Discord is rate limited. Try setup again later.'
            : `Discord bot access failed (${response.status}). Check installation and permissions.`
        );
      return response.json();
    }
    const me: { id: string } = await bot('/users/@me');
    const member: { roles: string[] } = await bot(
      `/guilds/${args.guildId}/members/${me.id}`
    );
    const roles: Role[] = await bot(`/guilds/${args.guildId}/roles`);
    const { roles: botRoles, permissions } = memberCapabilities(
      roles,
      member.roles,
      args.guildId
    );
    if (!hasPermissions(permissions, DISCORD_PERMISSIONS.auditLog))
      throw new Error(
        'Bot needs View Audit Log permission to observe Discord moderation.'
      );
    if (!hasPermissions(permissions, DISCORD_PERMISSIONS.createInvite))
      throw new Error(
        'Bot needs Create Instant Invite permission for explicit member connections.'
      );
    const required =
      args.mode === 'membership'
        ? DISCORD_PERMISSIONS.kick | DISCORD_PERMISSIONS.ban
        : DISCORD_PERMISSIONS.manageRoles;
    if (!hasPermissions(permissions, required))
      throw new Error(
        args.mode === 'membership'
          ? 'Bot needs Kick Members and Ban Members permissions.'
          : 'Bot needs Manage Roles permission.'
      );
    const highest = Math.max(...botRoles.map(r => r.position));
    if (highest <= 0)
      throw new Error('Move the bot role above the managed member roles.');
    let role = args.roleId ? roles.find(r => r.id === args.roleId) : undefined;
    if (args.mode === 'membership' && args.roleId)
      throw new Error('Server membership mode does not use a managed role.');
    if (
      args.roleId &&
      (!role ||
        role.managed ||
        role.id === args.guildId ||
        !botRoles.some(botRole => roleAbove(botRole, role!, args.guildId)) ||
        (BigInt(role.permissions) & ~MEMBER_PERMISSIONS) !== 0n)
    )
      throw new Error(
        'Choose a dedicated ordinary-member role below the bot role, without staff permissions.'
      );
    if (args.landingChannelId) {
      const channel: { guild_id: string; type: number } = await bot(
        `/channels/${args.landingChannelId}`
      );
      if (channel.guild_id !== args.guildId || ![0, 5].includes(channel.type))
        throw new Error(
          'Choose a text landing channel in the selected Discord server.'
        );
    }
    const reservation = await ctx.runMutation(
      internal.groupDiscord.mutations.reserve,
      {
        ...args,
        mode: args.mode ?? 'role',
        guildName: guild.name,
        guildIconUrl: verifiedGuildIconUrl(guild.id, guild.icon),
      }
    );
    try {
      if ((args.mode ?? 'role') === 'role' && !role)
        role = await bot(`/guilds/${args.guildId}/roles`, {
          method: 'POST',
          body: JSON.stringify({
            name: manager.groupName,
            permissions: '0',
            hoist: false,
            mentionable: false,
          }),
        });
      if (
        (args.mode ?? 'role') === 'role' &&
        (!role ||
          typeof role.id !== 'string' ||
          typeof role.name !== 'string' ||
          role.managed ||
          role.id === args.guildId ||
          !botRoles.some(botRole => roleAbove(botRole, role!, args.guildId)) ||
          (BigInt(role.permissions) & ~MEMBER_PERMISSIONS) !== 0n)
      )
        throw new Error(
          'Discord role creation returned an unsuitable role. Contact Discord staff before retrying.'
        );
      await ctx.runMutation(internal.groupDiscord.mutations.complete, {
        ...reservation,
        roleId: role?.id,
        roleName: role?.name,
      });
    } catch (error) {
      await ctx.runMutation(internal.groupDiscord.mutations.fail, {
        ...reservation,
        error: error instanceof Error ? error.message : 'Discord setup failed.',
        provisionedRoleId:
          !args.roleId && typeof role?.id === 'string' ? role.id : undefined,
      });
      throw error;
    }
    const result = await ctx.runQuery(api.groupDiscord.queries.getConnection, {
      groupId: args.groupId,
    });
    if (!result) throw new Error('Discord connection was retired.');
    return result;
  },
});

/** Refresh display metadata only; fresh two-sided authority never changes managed access. */
export const refreshMetadata = action({
  args: { groupId: v.id('groups') },
  returns: v.null(),
  handler: async (ctx, { groupId }): Promise<null> => {
    const current = await ctx.runQuery(api.groupDiscord.queries.getConnection, {
      groupId,
    });
    if (!current || current.status !== 'active')
      throw new Error(
        'An active Discord connection is required to refresh server details.'
      );
    const guild = await manageableGuild(ctx, current.guildId);
    return ctx.runMutation(internal.groupDiscord.mutations.refreshMetadata, {
      groupId,
      guildId: current.guildId,
      generation: current.generation,
      guildName: guild.name,
      guildIconUrl: verifiedGuildIconUrl(guild.id, guild.icon),
    });
  },
});

'use node';
import { action } from '../_generated/server';
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
      permissions: string;
      owner?: boolean;
    }[] = await guildResponse.json();
    const guild = guilds.find(g => g.id === args.guildId);
    if (
      !guild ||
      (!guild.owner &&
        (BigInt(guild.permissions) & 8n) === 0n &&
        !hasManageGuildPermission(guild.permissions))
    )
      throw new Error('Discord Manage Server authority is required.');
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
    const botRoles = roles.filter(
      r => r.id === args.guildId || member.roles.includes(r.id)
    );
    const permissions = botRoles.reduce(
      (p, r) => p | BigInt(r.permissions),
      0n
    );
    if ((permissions & 8n) === 0n && (permissions & 128n) === 0n)
      throw new Error(
        'Bot needs View Audit Log permission to observe Discord moderation.'
      );
    if ((permissions & 8n) === 0n && (permissions & 1n) === 0n)
      throw new Error(
        'Bot needs Create Instant Invite permission for explicit member connections.'
      );
    const required = args.mode === 'membership' ? 6n : 268435456n;
    if ((permissions & 8n) === 0n && (permissions & required) !== required)
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
      { ...args, mode: args.mode ?? 'role', guildName: guild.name }
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

'use node';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { MEMBER_PERMISSIONS } from './permissions';
const BASE = 'https://discord.com/api/v10';
class Retry extends Error {
  constructor(public delay: number) {
    super('Discord temporarily unavailable.');
  }
}
export const run = internalAction({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.runMutation(
      internal.groupDiscord.enrollment.claimGrant,
      args
    );
    if (!row) return;
    const token = process.env.DISCORD_BOT_TOKEN;
    const fence = () =>
      ctx.runQuery(internal.groupDiscord.enrollment.fence, args);
    const memberPath = `/guilds/${row.guildId}/members/${row.discordUserId}`;
    const rolePath = `${memberPath}/roles/${row.roleId}`;
    let attempted = false;
    async function bot(path: string, method = 'GET', reason?: string) {
      if (!token)
        throw new Error(
          'Discord bot unavailable. Contact the Groupi administrator.'
        );
      const response = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bot ${token}`,
          ...(reason ? { 'X-Audit-Log-Reason': reason } : {}),
        },
      });
      if (response.status === 429) {
        const body = await response.json();
        throw new Retry(
          Math.max(
            1000,
            Number(
              response.headers.get('Retry-After') ?? body.retry_after ?? 1
            ) * 1000
          )
        );
      }
      if (response.status >= 500) throw new Retry(5000);
      return response;
    }
    try {
      await ctx.runAction(internal.groupDiscord.reconcile.observeGuild, {
        guildId: row.guildId,
      });
      if (!(await fence()))
        throw new Error(
          'Group access or linked Discord identity changed. Connect again.'
        );
      const ban = await bot(`/guilds/${row.guildId}/bans/${row.discordUserId}`);
      if (ban.ok)
        throw new Error(
          'Discord staff have banned this account. Contact Discord staff.'
        );
      if (ban.status !== 404 || (await ban.json()).code !== 10026)
        throw new Error(
          'Discord ban verification unavailable. Check bot permissions.'
        );
      const response = await bot(memberPath);
      if (!response.ok)
        throw new Error('Discord membership is unavailable. Connect again.');
      const member: { roles: string[]; pending?: boolean } =
        await response.json();
      if (member.pending) {
        await ctx.runMutation(internal.groupDiscord.enrollment.finish, {
          ...args,
          status: 'screening',
        });
        return;
      }
      const meResponse = await bot('/users/@me');
      const rolesResponse = await bot(`/guilds/${row.guildId}/roles`);
      const guildResponse = await bot(`/guilds/${row.guildId}`);
      if (!meResponse.ok || !rolesResponse.ok || !guildResponse.ok)
        throw new Error('Discord bot capabilities could not be verified.');
      const me: { id: string } = await meResponse.json();
      const botResponse = await bot(`/guilds/${row.guildId}/members/${me.id}`);
      if (!botResponse.ok)
        throw new Error('Discord bot membership could not be verified.');
      const botMember: { roles: string[] } = await botResponse.json();
      const roles: {
        id: string;
        permissions: string;
        position: number;
        managed?: boolean;
      }[] = await rolesResponse.json();
      const guild: { owner_id: string } = await guildResponse.json();
      const botRoles = roles.filter(
        r => r.id === row.guildId || botMember.roles.includes(r.id)
      );
      const permissions = botRoles.reduce(
        (p, r) => p | BigInt(r.permissions),
        0n
      );
      const role = roles.find(r => r.id === row.roleId);
      if (
        (permissions & 8n) === 0n &&
        (permissions & 268435584n) !== 268435584n
      )
        throw new Error('Discord bot needs Manage Roles and View Audit Log.');
      if (
        !role ||
        role.managed ||
        role.id === row.guildId ||
        role.position >= Math.max(...botRoles.map(r => r.position)) ||
        (BigInt(role.permissions) & ~MEMBER_PERMISSIONS) !== 0n
      )
        throw new Error(
          'Dedicated ordinary-member role is no longer safely manageable.'
        );
      const targetPermissions = roles
        .filter(r => r.id === row.guildId || member.roles.includes(r.id))
        .reduce((p, r) => p | BigInt(r.permissions), 0n);
      const externalException =
        guild.owner_id === row.discordUserId
          ? 'Discord server owner access is externally managed. Removing the Groupi role cannot revoke server-owner access.'
          : (targetPermissions & 8n) !== 0n
            ? 'Discord Administrator access is externally managed. Removing the Groupi role cannot revoke that independent access.'
            : undefined;
      if (!(await fence()))
        throw new Error('Group access changed before role grant.');
      if (!member.roles.includes(row.roleId)) {
        if (
          !(await ctx.runMutation(
            internal.groupDiscord.enrollment.markGrantAttempt,
            args
          ))
        )
          throw new Error('Group access changed before role grant.');
        attempted = true;
        const granted = await bot(rolePath, 'PUT');
        if (!granted.ok)
          throw new Error(
            'Discord role grant denied. Check bot permissions and hierarchy.'
          );
      }
      const observedResponse = await bot(memberPath);
      if (!observedResponse.ok) throw new Retry(5000);
      const observed: { roles: string[]; pending?: boolean } =
        await observedResponse.json();
      if (!(await fence()))
        throw new Error('Group access changed during role grant.');
      const completed = await ctx.runMutation(
        internal.groupDiscord.enrollment.finish,
        {
          ...args,
          externalException,
          status: observed.pending
            ? 'screening'
            : observed.roles.includes(row.roleId)
              ? 'connected'
              : 'blocked',
          error:
            !observed.pending && !observed.roles.includes(row.roleId)
              ? 'Discord role access not observed. Connect again.'
              : undefined,
        }
      );
      if (!completed)
        throw new Error('Group access changed during role grant.');
    } catch (error) {
      if (attempted && !(await fence())) {
        // Persist the obligation before attempting compensation; lifecycle workers own retry.
        const cleanupId = await ctx.runMutation(
          internal.groupDiscord.enrollment.oweCleanup,
          {
            groupId: row.groupId,
            guildId: row.guildId,
            discordUserId: row.discordUserId,
            roleId: row.roleId,
            generation: row.generation,
            connectionGeneration: row.connectionGeneration,
            personId: row.personId,
          }
        );
        if (cleanupId)
          try {
            const removed = await bot(
              rolePath,
              'DELETE',
              `groupi-cleanup:${cleanupId}`
            );
            if (!removed.ok)
              throw new Error(
                'Discord role cleanup denied. Check bot permissions and hierarchy.'
              );
            const observedRemoval = await bot(memberPath);
            const removalBody = await observedRemoval.json();
            if (
              !(
                observedRemoval.ok &&
                Array.isArray(removalBody.roles) &&
                !removalBody.roles.includes(row.roleId)
              ) &&
              !(observedRemoval.status === 404 && removalBody.code === 10007)
            )
              throw new Error(
                'Discord role cleanup absence has not been observed. Retry pending.'
              );
            await ctx.runMutation(
              internal.groupDiscord.enrollment.completeCompensation,
              { cleanupId }
            );
          } catch (cleanupError) {
            await ctx.runMutation(
              internal.groupDiscord.reconciliation.cleanupOutcome,
              {
                id: cleanupId,
                error:
                  cleanupError instanceof Error
                    ? cleanupError.message
                    : 'Discord role cleanup failed. Retry pending.',
                delay:
                  cleanupError instanceof Retry ? cleanupError.delay : 5000,
              }
            );
          }
      }
      if (
        (error instanceof Retry || error instanceof TypeError) &&
        (await fence()) &&
        row.attempts < 8
      ) {
        await ctx.runMutation(internal.groupDiscord.enrollment.scheduleGrant, {
          ...args,
          delay:
            error instanceof Retry
              ? error.delay
              : Math.min(60000, 1000 * 2 ** row.attempts),
        });
        return;
      }
      await ctx.runMutation(internal.groupDiscord.enrollment.finish, {
        ...args,
        status: 'blocked',
        error:
          error instanceof Error ? error.message : 'Discord connection failed.',
      });
    }
  },
});

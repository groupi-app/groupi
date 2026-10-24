'use node';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { joinDiscordGuild } from '../discord/userApi';
const BASE = 'https://discord.com/api/v10';
/** Explicit consent only. Admission never calls this entry point. */
export const connect = action({
  args: { groupId: v.id('groups'), consent: v.literal(true) },
  returns: v.object({ requiresConsent: v.optional(v.boolean()) }),
  handler: async (ctx, { groupId }): Promise<{ requiresConsent?: boolean }> => {
    await ctx.runQuery(internal.groupDiscord.enrollment.context, { groupId });
    const accounts = await ctx.runQuery(
      internal.accounts.queries.getAccountsForEnrichment,
      {}
    );
    const account = accounts.accounts.find(
      a =>
        a.providerId === 'discord' &&
        (!accounts.selectedDiscordUserId ||
          a.accountId === accounts.selectedDiscordUserId)
    );
    if (!account) return { requiresConsent: true };
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('Discord bot is unavailable.');
    let row = await ctx.runMutation(internal.groupDiscord.enrollment.begin, {
      groupId,
      discordUserId: account.accountId,
    });
    if (row.desired !== 'granted')
      throw new Error(
        row.error ?? 'Discord cleanup must complete before Connect.'
      );
    const fence = () =>
      ctx.runQuery(internal.groupDiscord.enrollment.fence, {
        enrollmentId: row._id,
        generation: row.generation,
      });
    const bot = (path: string, method = 'GET') =>
      fetch(`${BASE}${path}`, {
        method,
        headers: { Authorization: `Bot ${token}` },
      });
    let joinAttempted = false;
    const memberPath = `/guilds/${row.guildId}/members/${row.discordUserId}`;
    try {
      const ban = await bot(`/guilds/${row.guildId}/bans/${row.discordUserId}`);
      if (ban.ok)
        throw new Error(
          'Discord staff have banned this account. Contact Discord staff.'
        );
      if (ban.status !== 404 || (await ban.json()).code !== 10026)
        throw new Error(
          'Discord ban verification is unavailable. Check bot permissions.'
        );
      let memberResponse = await bot(memberPath);
      if (
        row.status === 'connected' &&
        (memberResponse.status === 404 ||
          (row.mode !== 'membership' &&
            memberResponse.ok &&
            !(await memberResponse.clone().json()).roles.includes(row.roleId)))
      )
        row = await ctx.runMutation(internal.groupDiscord.enrollment.begin, {
          groupId,
          discordUserId: account.accountId,
          fresh: true,
        });
      if (row.desired !== 'granted')
        throw new Error(
          row.error ?? 'Discord access is blocked. Connect again.'
        );
      if (memberResponse.status === 404) {
        const missing = await memberResponse.json();
        if (missing.code !== 10007)
          throw new Error('Discord server verification is unavailable.');
        if (!(await fence()))
          throw new Error('Group access changed before joining.');
        const joined = await joinDiscordGuild(
          ctx,
          account.accountId,
          row.guildId,
          token,
          async () => {
            if (!(await fence())) return false;
            if (row.mode === 'membership') {
              const meResponse = await bot('/users/@me');
              const rolesResponse = await bot(`/guilds/${row.guildId}/roles`);
              if (!meResponse.ok || !rolesResponse.ok)
                throw new Error(
                  'Discord bot capabilities could not be verified before joining.'
                );
              const me: { id: string } = await meResponse.json();
              const botResponse = await bot(
                `/guilds/${row.guildId}/members/${me.id}`
              );
              if (!botResponse.ok)
                throw new Error(
                  'Discord bot membership unavailable before joining.'
                );
              const botMember: { roles: string[] } = await botResponse.json();
              const roles: { id: string; permissions: string }[] =
                await rolesResponse.json();
              const permissions = roles
                .filter(
                  r => r.id === row.guildId || botMember.roles.includes(r.id)
                )
                .reduce((bits, r) => bits | BigInt(r.permissions), 0n);
              if ((permissions & 8n) === 0n && (permissions & 134n) !== 134n)
                throw new Error(
                  'Discord bot needs Kick Members, Ban Members and View Audit Log before joining.'
                );
            }
            if (
              !(await ctx.runMutation(
                internal.groupDiscord.enrollment.markGrantAttempt,
                { enrollmentId: row._id, generation: row.generation }
              ))
            )
              return false;
            joinAttempted = true;
            await ctx.runMutation(
              internal.groupDiscord.enrollment.scheduleGrant,
              {
                enrollmentId: row._id,
                generation: row.generation,
                delay: 60000,
              }
            );
            return true;
          }
        );
        if (!joined) {
          await ctx.runMutation(
            internal.groupDiscord.enrollment.cancelUnconsented,
            { enrollmentId: row._id, generation: row.generation }
          );
          return { requiresConsent: true };
        }
        if (!joined.ok)
          throw new Error(
            'Discord join failed. Contact Discord staff or try Connect again.'
          );
        // Never pass roles/verification bypass fields to Discord's join endpoint.
        const afterJoin = await bot(memberPath);
        if (!afterJoin.ok)
          throw new Error(
            'Discord membership could not be observed after joining.'
          );
        const joinedMember = await afterJoin.json();
        memberResponse = new Response(JSON.stringify(joinedMember), {
          status: 200,
        });
      }
      if (!(await fence()))
        throw new Error(
          'Group access changed during Discord membership enrollment.'
        );
      if (!memberResponse.ok)
        throw new Error('Discord member verification failed.');
      const member: { roles: string[]; pending?: boolean } =
        await memberResponse.json();
      if (member.pending) {
        await ctx.runMutation(internal.groupDiscord.enrollment.finish, {
          enrollmentId: row._id,
          generation: row.generation,
          status: 'screening',
        });
        return {};
      }
      await ctx.runMutation(internal.groupDiscord.enrollment.scheduleGrant, {
        enrollmentId: row._id,
        generation: row.generation,
      });
      await ctx.runAction(internal.groupDiscord.grant.run, {
        enrollmentId: row._id,
        generation: row.generation,
      });
      return {};
    } catch (error) {
      if (joinAttempted && !(await fence())) {
        await ctx.runMutation(internal.groupDiscord.enrollment.oweCleanup, {
          groupId: row.groupId,
          guildId: row.guildId,
          discordUserId: row.discordUserId,
          roleId: row.roleId,
          mode: row.mode,
          generation: row.generation,
          connectionGeneration: row.connectionGeneration,
          personId: row.personId,
        });
        await ctx.runAction(internal.groupDiscord.reconcile.dispatch, {});
      }
      await ctx.runMutation(internal.groupDiscord.enrollment.finish, {
        enrollmentId: row._id,
        generation: row.generation,
        status: 'blocked',
        error:
          error instanceof Error ? error.message : 'Discord connection failed.',
      });
      throw error;
    }
  },
});

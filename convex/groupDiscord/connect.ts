'use node';
import {
  memberCapabilities,
  hasPermissions,
  DISCORD_PERMISSIONS,
} from './permissions';
import { action, internalAction, type ActionCtx } from '../_generated/server';
import { api, internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { v } from 'convex/values';
import { joinDiscordGuild } from '../discord/userApi';
import { runGrant } from './grant';
import { dispatchReconciliation, observeGuildAccess } from './reconcile';
import { discordBot, ProviderFailure } from './provider';
/** Explicit consent only. Admission never calls this entry point. */
export const connectMember = async (
  ctx: ActionCtx,
  {
    groupId,
    expectedGeneration,
    hostedState,
  }: {
    groupId: Id<'groups'>;
    expectedGeneration?: number;
    hostedState?: string;
    consent: true;
  }
): Promise<{ requiresConsent?: boolean }> => {
  await ctx.runQuery(internal.groupDiscord.enrollment.context, {
    groupId,
    expectedGeneration,
    hostedState,
  });
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
  if (!account || accounts.managedDiscordIdentityRetired)
    return { requiresConsent: true };
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('Discord bot is unavailable.');
  const row = await ctx.runMutation(internal.groupDiscord.enrollment.begin, {
    groupId,
    expectedGeneration,
    hostedState,
    discordUserId: account.accountId,
  });
  if (row.desired !== 'granted')
    throw new Error(
      row.error ?? 'Discord cleanup must complete before Connect.'
    );
  return continueConnect(ctx, row, async () => {
    const fresh = await ctx.runMutation(
      internal.groupDiscord.enrollment.begin,
      {
        groupId,
        expectedGeneration,
        hostedState,
        discordUserId: account.accountId,
        fresh: true,
      }
    );
    return fresh;
  });
};

async function continueConnect(
  ctx: ActionCtx,
  row: Doc<'groupDiscordEnrollments'>,
  refresh?: () => Promise<Doc<'groupDiscordEnrollments'>>,
  userId?: string
): Promise<{ requiresConsent?: boolean }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('Discord bot is unavailable.');
  const fence = () =>
    ctx.runQuery(internal.groupDiscord.enrollment.fence, {
      enrollmentId: row._id,
      generation: row.generation,
    });
  const bot = (path: string, method = 'GET') =>
    discordBot(ctx, path, { method });
  let joinAttempted = !!row.grantAttemptedAt;
  const memberPath = `/guilds/${row.guildId}/members/${row.discordUserId}`;
  try {
    if (userId) {
      await observeGuildAccess(ctx, { guildId: row.guildId });
      if (!(await fence()))
        throw new Error(
          'Discord moderation or Group access changed. Connect again.'
        );
    }
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
      refresh &&
      row.status === 'connected' &&
      (memberResponse.status === 404 ||
        (row.mode !== 'membership' &&
          memberResponse.ok &&
          !(await memberResponse.clone().json()).roles.includes(row.roleId)))
    )
      row = await refresh();
    if (row.desired !== 'granted')
      throw new Error(row.error ?? 'Discord access is blocked. Connect again.');
    if (memberResponse.status === 404) {
      const missing = await memberResponse.json();
      if (missing.code !== 10007)
        throw new Error('Discord server verification is unavailable.');
      if (!(await fence()))
        throw new Error('Group access changed before joining.');
      const joined = await joinDiscordGuild(
        ctx,
        row.discordUserId,
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
            const { permissions } = memberCapabilities(
              roles,
              botMember.roles,
              row.guildId
            );
            if (
              !hasPermissions(
                permissions,
                DISCORD_PERMISSIONS.membershipEnrollment
              )
            )
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
            internal.groupDiscord.enrollment.scheduleConnect,
            {
              enrollmentId: row._id,
              generation: row.generation,
              delay: 10 * 60 * 1000,
            }
          );
          return true;
        },
        userId
      );
      if (!joined) {
        await ctx.runMutation(
          internal.groupDiscord.enrollment.cancelUnconsented,
          { enrollmentId: row._id, generation: row.generation }
        );
        return { requiresConsent: true };
      }
      if (joined.status === 429 || joined.status >= 500)
        throw new ProviderFailure(
          'Discord join temporarily unavailable; retry pending.',
          joined.status === 429
            ? Math.max(
                1000,
                Number(joined.headers.get('Retry-After') ?? 1) * 1000
              )
            : 5000
        );
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
    await runGrant(ctx, {
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
      await dispatchReconciliation(ctx);
    }
    if (
      (error instanceof ProviderFailure || error instanceof TypeError) &&
      (await fence())
    ) {
      await ctx.runMutation(internal.groupDiscord.enrollment.scheduleConnect, {
        enrollmentId: row._id,
        generation: row.generation,
        delay: error instanceof ProviderFailure ? error.delay : 5000,
      });
      return {};
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
}
export const connect = action({
  args: {
    groupId: v.id('groups'),
    consent: v.literal(true),
    expectedGeneration: v.optional(v.number()),
    hostedState: v.optional(v.string()),
  },
  returns: v.object({ requiresConsent: v.optional(v.boolean()) }),
  handler: connectMember,
});

/** Hosted requests recheck the signed-in subject and short-lived journey before native Connect. */
export const connectHosted = action({
  args: { state: v.string(), consent: v.literal(true) },
  returns: v.object({ requiresConsent: v.optional(v.boolean()) }),
  handler: async (ctx, { state }): Promise<{ requiresConsent?: boolean }> => {
    const journey = await ctx.runQuery(api.groupDiscord.delegated.inspect, {
      state,
    });
    if (!journey) throw new Error('Connection request unavailable or expired.');
    return connectMember(ctx, {
      groupId: journey.groupId,
      expectedGeneration: journey.generation,
      hostedState: state,
      consent: true,
    });
  },
});

export const resume = internalAction({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const current = await ctx.runMutation(
      internal.groupDiscord.enrollment.claimConnect,
      args
    );
    if (current)
      await continueConnect(ctx, current.row, undefined, current.userId);
    return null;
  },
});

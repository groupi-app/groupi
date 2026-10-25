import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../_generated/server';
import { components, internal } from '../_generated/api';
import { ConvexError, v } from 'convex/values';
import { createAuth } from '../auth';
import { partitionManageableGuilds } from './permissions';
import type { DiscordGuildWithPermissions } from './permissions';

const identity = { personId: v.id('persons'), userId: v.string() };
const guild = v.object({
  guildId: v.string(),
  guildName: v.string(),
  botInstalled: v.boolean(),
});

// Only trusted REST middleware supplies this identity pair. Never accept it in
// public arguments or forward request/session headers into Better Auth.
export const resolveIdentity = internalQuery({
  args: identity,
  handler: async (ctx, { personId, userId }) => {
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      throw new Error('Discord identity mismatch');
    return null;
  },
});

export const replaceGuilds = internalMutation({
  args: { ...identity, guilds: v.array(guild) },
  handler: async (ctx, { personId, userId, guilds }) => {
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      throw new Error('Discord identity mismatch');
    const existing = await ctx.db
      .query('discordGuildAuthorizations')
      .withIndex('by_person', q => q.eq('personId', personId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    const authorizedAt = Date.now();
    for (const row of guilds)
      await ctx.db.insert('discordGuildAuthorizations', {
        ...row,
        personId,
        authorizedAt,
      });
    return {
      count: guilds.length,
      authorizedAt,
      expiresAt: authorizedAt + 900000,
    };
  },
});

export const listGuilds = internalQuery({
  args: {
    ...identity,
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { personId, userId, limit, cursor }) => {
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      throw new Error('Discord identity mismatch');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error('Invalid page size');
    let rawCursor: string | null = null;
    const invalidCursor = () =>
      new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Discord guild cursor. Start again without a cursor.',
      });
    if (cursor) {
      try {
        const decoded = JSON.parse(atob(cursor));
        if (
          decoded.scope !== `discord-guilds:${personId}` ||
          typeof decoded.cursor !== 'string'
        )
          throw invalidCursor();
        rawCursor = decoded.cursor;
      } catch {
        throw invalidCursor();
      }
    }
    const page = await ctx.db
      .query('discordGuildAuthorizations')
      .withIndex('by_person', q => q.eq('personId', personId))
      .paginate({ numItems: limit, cursor: rawCursor })
      .catch(() => {
        throw invalidCursor();
      });
    return {
      items: page.page.map(row => ({
        id: row.guildId,
        name: row.guildName,
        status: row.botInstalled
          ? ('available' as const)
          : ('invitable' as const),
        authorizedAt: row.authorizedAt,
        expiresAt: row.authorizedAt + 900000,
      })),
      nextCursor: page.isDone
        ? null
        : btoa(
            JSON.stringify({
              scope: `discord-guilds:${personId}`,
              cursor: page.continueCursor,
            })
          ),
    };
  },
});

export const refreshGuilds = internalAction({
  args: identity,
  handler: async (
    ctx,
    args
  ): Promise<
    | { count: number; authorizedAt: number; expiresAt: number }
    | { error: string }
  > => {
    await ctx.runQuery(internal.discord.cli.resolveIdentity, args);
    if (!process.env.DISCORD_BOT_TOKEN) return { error: 'BOT_UNAVAILABLE' };
    const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'account',
      where: [
        { field: 'userId', value: args.userId },
        { field: 'providerId', value: 'discord' },
      ],
    });
    if (!account) return { error: 'DISCORD_NOT_LINKED' };
    try {
      const tokens = await createAuth(ctx).api.getAccessToken({
        body: {
          providerId: 'discord',
          userId: args.userId,
          accountId: account.accountId,
        },
      });
      if (!tokens.accessToken) return { error: 'DISCORD_AUTH_REQUIRED' };
      const userGuilds = await fetchGuildPages(`Bearer ${tokens.accessToken}`);
      const botGuilds = await fetchGuildPages(
        `Bot ${process.env.DISCORD_BOT_TOKEN}`
      );
      const result = partitionManageableGuilds(
        userGuilds,
        new Set(botGuilds.map(row => row.id))
      );
      return await ctx.runMutation(internal.discord.cli.replaceGuilds, {
        ...args,
        guilds: [
          ...result.available.map(row => ({
            guildId: row.id,
            guildName: row.name,
            botInstalled: true,
          })),
          ...result.invitable.map(row => ({
            guildId: row.id,
            guildName: row.name,
            botInstalled: false,
          })),
        ],
      });
    } catch {
      // No external response bodies, credentials, or adapter errors reach clients.
      return { error: 'DISCORD_UNAVAILABLE' };
    }
  },
});

/** Discord guild lists are capped at 200 per response; exhaust both identities. */
export async function fetchGuildPages(
  authorization: string
): Promise<DiscordGuildWithPermissions[]> {
  const rows: DiscordGuildWithPermissions[] = [];
  let after = '';
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({
      limit: '200',
      ...(after ? { after } : {}),
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let result: unknown;
    try {
      const response = await fetch(
        `https://discord.com/api/v10/users/@me/guilds?${query}`,
        {
          headers: { Authorization: authorization },
          redirect: 'error',
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error('Discord unavailable');
      result = await response.json();
    } finally {
      clearTimeout(timeout);
    }
    if (
      !Array.isArray(result) ||
      result.some(
        row =>
          !row || typeof row.id !== 'string' || typeof row.name !== 'string'
      )
    )
      throw new Error('Invalid Discord response');
    rows.push(...result);
    if (result.length < 200) return rows;
    const last = result[result.length - 1].id;
    if (last === after) throw new Error('Repeated Discord page');
    after = last;
  }
  throw new Error('Discord guild limit exceeded');
}

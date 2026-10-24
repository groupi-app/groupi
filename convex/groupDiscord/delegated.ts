import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from '../_generated/server';
import { requireAuth } from '../auth';
import { authorizeCommunity } from '../groups/community';
import { denied, randomSecret, secretHash } from '../authorization/model';
import { eligibleConnection, getMemberStatus } from './memberOperations';
import { memberStatus } from './contracts';

const scope = {
  credentialId: v.id('authorizationCredentials'),
  groupId: v.string(),
};
export const status = internalQuery({
  args: scope,
  returns: v.union(memberStatus, v.null()),
  handler: async (ctx, args) => {
    const actor = await authorizeCommunity(ctx, args, 'groups.discord.read');
    return getMemberStatus(ctx, actor.groupId, actor.personId);
  },
});

/** Initiation conveys no Discord consent. Only the signed-in member can continue. */
export const initiate = internalMutation({
  args: { ...scope, returnUrl: v.string() },
  returns: v.object({ url: v.string(), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    const actor = await authorizeCommunity(ctx, args, 'groups.discord.connect');
    const connection = await eligibleConnection(
      ctx,
      actor.groupId,
      actor.personId
    );
    const app = await ctx.db.get(actor.grant.appId!);
    let target: URL;
    try {
      target = new URL(args.returnUrl);
    } catch {
      throw denied('Invalid return URL.');
    }
    // Exact registered destinations, without credentials/fragments or caller query additions.
    if (
      !app ||
      target.protocol !== 'https:' ||
      target.username ||
      target.password ||
      target.hash ||
      !app.redirectUris.includes(target.href)
    )
      throw denied('Use a registered HTTPS return URL.');
    const origin = new URL(process.env.SITE_URL ?? '');
    if (origin.protocol !== 'https:' || origin.username || origin.password)
      throw denied('Hosted connection is unavailable.');
    const state = randomSecret();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await ctx.db.insert('groupDiscordJourneys', {
      stateHash: await secretHash(state),
      credentialId: args.credentialId,
      appId: app._id,
      personId: actor.personId,
      groupId: actor.groupId,
      connectionId: connection._id,
      generation: connection.generation,
      returnUrl: target.href,
      expiresAt,
    });
    const url = new URL('/oauth/discord', origin.origin);
    url.searchParams.set('state', state);
    return { url: url.href, expiresAt };
  },
});

export async function loadJourney(
  ctx:
    | import('../_generated/server').QueryCtx
    | import('../_generated/server').MutationCtx,
  state: string
) {
  const { person } = await requireAuth(ctx);
  const hash = await secretHash(state);
  const row = await ctx.db
    .query('groupDiscordJourneys')
    .withIndex('by_state', q => q.eq('stateHash', hash))
    .unique();
  if (
    !row ||
    row.consumedAt !== undefined ||
    row.expiresAt <= Date.now() ||
    row.personId !== person._id
  )
    throw denied('Connection request unavailable or expired.');
  const actor = await authorizeCommunity(
    ctx,
    { credentialId: row.credentialId, groupId: row.groupId },
    'groups.discord.connect'
  );
  if (actor.grant.appId !== row.appId || actor.personId !== row.personId)
    throw denied();
  const app = await ctx.db.get(row.appId);
  if (!app?.redirectUris.includes(row.returnUrl))
    throw denied('Application return destination changed. Start again.');
  const connection = await ctx.db.get(row.connectionId);
  if (
    !connection ||
    connection.status !== 'active' ||
    connection.groupId !== row.groupId ||
    connection._id !== row.connectionId ||
    connection.generation !== row.generation
  )
    throw denied(
      'Discord configuration changed. Return to the app and start again.'
    );
  return row;
}
export const inspect = query({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    let row;
    try {
      row = await loadJourney(ctx, state);
    } catch {
      return null;
    }
    const app = await ctx.db.get(row.appId);
    return {
      groupId: row.groupId,
      generation: row.generation,
      appName: app!.name,
      status: await getMemberStatus(ctx, row.groupId, row.personId),
    };
  },
});
/** Consume once, after explicit member confirmation, before returning to the exact app. */
export const finish = mutation({
  args: { state: v.string(), consent: v.literal(true) },
  returns: v.object({ returnUrl: v.string() }),
  handler: async (ctx, { state }) => {
    const row = await loadJourney(ctx, state);
    await ctx.db.patch(row._id, { consumedAt: Date.now() });
    return { returnUrl: row.returnUrl };
  },
});

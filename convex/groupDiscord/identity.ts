import { internalMutation } from '../_generated/server';
import { components } from '../_generated/api';
import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { oweAccessCleanup } from './memberOperations';

/** Capture immutable bot cleanup targets before an account credential disappears. */
export async function retireDiscordIdentity(
  ctx: MutationCtx,
  userId: string,
  identity?: string,
  keepIdentity?: string
) {
  const person = await ctx.db
    .query('persons')
    .withIndex('by_user_id', q => q.eq('userId', userId))
    .unique();
  if (!person) return;
  if (identity) {
    const selected = await ctx.db
      .query('groupDiscordManagedIdentities')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .unique();
    if (selected?.discordUserId === identity)
      await ctx.db.patch(selected._id, { latestLinkHash: 'retired' });
    const retired = await ctx.db
      .query('groupDiscordRetiredIdentities')
      .withIndex('by_person_identity', q =>
        q.eq('personId', person._id).eq('discordUserId', identity)
      )
      .unique();
    if (!retired)
      await ctx.db.insert('groupDiscordRetiredIdentities', {
        personId: person._id,
        discordUserId: identity,
      });
  }
  const rows = await ctx.db
    .query('groupDiscordEnrollments')
    .withIndex('by_person', q => q.eq('personId', person._id))
    .collect();
  for (const row of rows) {
    if (
      row.desired !== 'granted' ||
      (identity && row.discordUserId !== identity) ||
      row.discordUserId === keepIdentity
    )
      continue;
    const connection = await ctx.db
      .query('groupDiscordConnections')
      .withIndex('by_group', q => q.eq('groupId', row.groupId))
      .unique();
    // A previous configuration handed retained access back to Discord staff.
    if (!connection || connection.generation !== row.connectionGeneration)
      continue;
    const retired = await ctx.db
      .query('groupDiscordRetiredIdentities')
      .withIndex('by_person_identity', q =>
        q.eq('personId', person._id).eq('discordUserId', row.discordUserId)
      )
      .unique();
    if (!retired)
      await ctx.db.insert('groupDiscordRetiredIdentities', {
        personId: person._id,
        discordUserId: row.discordUserId,
      });
    if (!(row.mode === 'membership' && row.externalException))
      await oweAccessCleanup(ctx, row);
    await ctx.db.patch(row._id, {
      desired: 'removed',
      status: 'blocked',
      error:
        row.mode === 'membership' && row.externalException
          ? `Discord identity retired. Membership remains externally managed: ${row.externalException}`
          : 'Discord identity retired. Previous managed access cleanup is pending; Connect again after cleanup completes.',
      updatedAt: Date.now(),
      nextObservationAt: Date.now(),
    });
  }
}

export const retire = internalMutation({
  args: {
    userId: v.string(),
    identity: v.optional(v.string()),
    keepIdentity: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await retireDiscordIdentity(
      ctx,
      args.userId,
      args.identity,
      args.keepIdentity
    );
    return null;
  },
});

/** Relinking credentials permits a fresh Connect only after all old cleanup settles. */
export const linked = internalMutation({
  args: {
    userId: v.string(),
    identity: v.string(),
    stateHash: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { userId, identity, stateHash }) => {
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();
    if (!person) return null;
    const accounts = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'account',
        where: [{ field: 'userId', value: userId }],
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );
    // A concurrent explicit unlink may already have removed this callback's account.
    if (
      !(accounts.page as AuthDoc<'account'>[]).some(
        a => a.providerId === 'discord' && a.accountId === identity
      )
    )
      return null;
    const selected = await ctx.db
      .query('groupDiscordManagedIdentities')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .unique();
    if (selected?.latestLinkHash && selected.latestLinkHash !== stateHash)
      return null;
    await retireDiscordIdentity(ctx, userId, undefined, identity);
    if (selected) await ctx.db.patch(selected._id, { discordUserId: identity });
    else
      await ctx.db.insert('groupDiscordManagedIdentities', {
        personId: person._id,
        discordUserId: identity,
      });
    const row = await ctx.db
      .query('groupDiscordRetiredIdentities')
      .withIndex('by_person_identity', q =>
        q.eq('personId', person._id).eq('discordUserId', identity)
      )
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});

/** Latest explicit link intent wins even when an older provider callback arrives late. */
export const linkIntent = internalMutation({
  args: { userId: v.string(), hash: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, hash }) => {
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();
    if (!person) return null;
    const selected = await ctx.db
      .query('groupDiscordManagedIdentities')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .unique();
    if (selected) await ctx.db.patch(selected._id, { latestLinkHash: hash });
    else
      await ctx.db.insert('groupDiscordManagedIdentities', {
        personId: person._id,
        latestLinkHash: hash,
      });
    return null;
  },
});

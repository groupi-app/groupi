import { internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { enrollmentAuthorized, oweAccessCleanup } from './memberOperations';

export const due = internalMutation({
  args: {},
  handler: async ctx => {
    const now = Date.now();
    const cleanup = await ctx.db
      .query('groupDiscordCleanup')
      .withIndex('by_status_nextAttemptAt', q =>
        q.eq('status', 'pending').lte('nextAttemptAt', now)
      )
      .take(25);
    const rows = await ctx.db
      .query('groupDiscordEnrollments')
      .withIndex('by_observation', q => q.lte('nextObservationAt', now))
      .take(25 - cleanup.length);
    for (const row of cleanup)
      await ctx.db.patch(row._id, { nextAttemptAt: now + 60000 });
    const managedRows = [];
    for (const row of rows) {
      const connection = await ctx.db
        .query('groupDiscordConnections')
        .withIndex('by_group', q => q.eq('groupId', row.groupId))
        .unique();
      if (!connection || connection.generation !== row.connectionGeneration) {
        await ctx.db.patch(row._id, {
          nextObservationAt: Number.MAX_SAFE_INTEGER,
        });
      } else {
        await ctx.db.patch(row._id, { nextObservationAt: now + 60000 });
        managedRows.push(row);
      }
    }
    const expired = await ctx.db
      .query('groupDiscordAuditEntries')
      .withIndex('by_expiry', q => q.lt('expiresAt', now))
      .take(25);
    for (const row of expired) await ctx.db.delete(row._id);
    return { cleanup, rows: managedRows };
  },
});
export const cleanupOutcome = internalMutation({
  args: {
    id: v.id('groupDiscordCleanup'),
    expectedDesired: v.optional(
      v.union(
        v.literal('role_removed'),
        v.literal('removed'),
        v.literal('banned')
      )
    ),
    error: v.optional(v.string()),
    delay: v.optional(v.number()),
  },
  handler: async (ctx, { id, error, delay, expectedDesired }) => {
    const row = await ctx.db.get(id);
    if (!row) return;
    if (expectedDesired && row.desired !== expectedDesired) return;
    await ctx.db.patch(id, {
      status: error ? 'pending' : 'completed',
      observed: error
        ? 'unknown'
        : row.desired === 'banned'
          ? 'banned'
          : 'absent',
      error,
      attempts: row.attempts + 1,
      nextAttemptAt: Date.now() + (delay ?? 300000),
      updatedAt: Date.now(),
    });
  },
});
export const observe = internalMutation({
  args: {
    id: v.id('groupDiscordEnrollments'),
    generation: v.number(),
    present: v.optional(v.boolean()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.generation !== args.generation) return;
    const connection = await ctx.db
      .query('groupDiscordConnections')
      .withIndex('by_group', q => q.eq('groupId', row.groupId))
      .unique();
    // Retained access is handed back; independently persisted cleanup is still dispatched.
    if (!connection || connection.generation !== row.connectionGeneration) {
      await ctx.db.patch(row._id, {
        nextObservationAt: Number.MAX_SAFE_INTEGER,
      });
      return;
    }
    const eligible = await enrollmentAuthorized(ctx, {
      ...row,
      desired: 'granted',
    });
    if (!eligible) {
      if (
        args.present !== false &&
        !(row.mode === 'membership' && row.externalException)
      )
        await oweAccessCleanup(ctx, { ...row, removal: row.cleanupDesired });
      await ctx.db.patch(row._id, {
        desired: 'removed',
        status: 'blocked',
        error:
          'Group access ended. Complete required onboarding and Connect again.',
        generation:
          row.desired === 'granted' ? row.generation + 1 : row.generation,
      });
    } else if (args.present === false && row.status === 'connected') {
      await ctx.db.patch(row._id, {
        desired: 'removed',
        status: 'blocked',
        generation: row.generation + 1,
        error: 'Discord access was removed. Connect again.',
      });
    }
    await ctx.db.patch(row._id, {
      nextObservationAt: Date.now() + 300000,
      observationError: args.error,
      lastObservedAt: args.error ? row.lastObservedAt : Date.now(),
    });
  },
});
export const stream = internalQuery({
  args: { guildId: v.string(), action: v.number() },
  handler: (ctx, args) =>
    ctx.db
      .query('groupDiscordAuditStreams')
      .withIndex('by_guild_action', q =>
        q.eq('guildId', args.guildId).eq('action', args.action)
      )
      .unique(),
});
const entry = v.object({
  id: v.string(),
  target_id: v.optional(v.string()),
  user_id: v.optional(v.string()),
  reason: v.optional(v.string()),
  removedRoleIds: v.optional(v.array(v.string())),
  uncertainRoleChange: v.optional(v.boolean()),
});
export const auditPage = internalMutation({
  args: {
    guildId: v.string(),
    action: v.number(),
    entries: v.array(entry),
    cursor: v.string(),
    overlap: v.boolean(),
    complete: v.boolean(),
    botId: v.string(),
  },
  handler: async (ctx, args) => {
    for (const event of args.entries) {
      const seen = await ctx.db
        .query('groupDiscordAuditEntries')
        .withIndex('by_guild_entry', q =>
          q.eq('guildId', args.guildId).eq('entryId', event.id)
        )
        .unique();
      if (seen) continue;
      const timestamp = Number(BigInt(event.id) >> 22n) + 1420070400000;
      const rows = event.target_id
        ? await ctx.db
            .query('groupDiscordEnrollments')
            .withIndex('by_guild_identity', q =>
              q
                .eq('guildId', args.guildId)
                .eq('discordUserId', event.target_id!)
            )
            .take(100)
        : [];
      if (rows.length === 100)
        throw new Error(
          'Discord moderation target backlog exceeds the safe batch. Observation blocked.'
        );
      for (const row of rows) {
        if (timestamp < row.startedAt) continue;
        const connection = await ctx.db
          .query('groupDiscordConnections')
          .withIndex('by_group', q => q.eq('groupId', row.groupId))
          .unique();
        if (!connection || connection.generation !== row.connectionGeneration)
          continue;
        const removed =
          args.action !== 25 ||
          (row.mode !== 'membership' && event.uncertainRoleChange) ||
          (row.mode !== 'membership' &&
            !!row.roleId &&
            event.removedRoleIds?.includes(row.roleId));
        if (!removed) continue;
        let own = false;
        if (
          event.user_id === args.botId &&
          event.reason?.startsWith('groupi-cleanup:')
        ) {
          const id = ctx.db.normalizeId(
            'groupDiscordCleanup',
            event.reason.slice(15)
          );
          const cleanup = id ? await ctx.db.get(id) : null;
          own =
            !!cleanup &&
            cleanup.guildId === row.guildId &&
            cleanup.discordUserId === row.discordUserId &&
            cleanup.roleId === row.roleId &&
            args.action === 25;
        }
        if (own) continue;
        if (row.desired === 'granted')
          await ctx.db.patch(row._id, {
            desired: 'removed',
            status: 'blocked',
            generation: row.generation + 1,
            error: 'Discord moderation removed access. Connect again.',
            updatedAt: Date.now(),
          });
      }
      await ctx.db.insert('groupDiscordAuditEntries', {
        guildId: args.guildId,
        entryId: event.id,
        expiresAt: Date.now() + 45 * 86400000,
      });
    }
    const stream = await ctx.db
      .query('groupDiscordAuditStreams')
      .withIndex('by_guild_action', q =>
        q.eq('guildId', args.guildId).eq('action', args.action)
      )
      .unique();
    const update = args.overlap
      ? { overlapCursor: args.complete ? undefined : args.cursor }
      : {
          cursor:
            stream && BigInt(stream.cursor) > BigInt(args.cursor)
              ? stream.cursor
              : args.cursor,
        };
    if (stream)
      await ctx.db.patch(stream._id, {
        ...update,
        error: undefined,
        observedAt: args.complete ? Date.now() : stream.observedAt,
      });
    else
      await ctx.db.insert('groupDiscordAuditStreams', {
        guildId: args.guildId,
        action: args.action,
        cursor: args.cursor,
        observedAt: args.complete ? Date.now() : undefined,
      });
  },
});

export const auditFailure = internalMutation({
  args: { guildId: v.string(), error: v.string() },
  handler: async (ctx, { guildId, error }) => {
    for (const action of [20, 22, 25]) {
      const stream = await ctx.db
        .query('groupDiscordAuditStreams')
        .withIndex('by_guild_action', q =>
          q.eq('guildId', guildId).eq('action', action)
        )
        .unique();
      if (stream) await ctx.db.patch(stream._id, { error });
      else
        await ctx.db.insert('groupDiscordAuditStreams', {
          guildId,
          action,
          cursor: '0',
          error,
        });
    }
  },
});

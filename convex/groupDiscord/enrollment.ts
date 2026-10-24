import { connectionDocument, enrollmentDocument } from './documents';
import { query, internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { internal } from '../_generated/api';
import {
  eligibleConnection,
  oweAccessCleanup,
  beginEnrollment,
  enrollmentAuthorized,
  getMemberStatus,
} from './memberOperations';
import { loadJourney } from './delegated';
import { memberStatus } from './contracts';
import { notifySynchronizationBlocked } from './notifications';
export const getStatus = query({
  args: { groupId: v.id('groups') },
  returns: v.union(memberStatus, v.null()),
  handler: async (ctx, { groupId }) => {
    const { person } = await requireAuth(ctx);
    return getMemberStatus(ctx, groupId, person._id);
  },
});
export const context = internalQuery({
  args: {
    groupId: v.id('groups'),
    expectedGeneration: v.optional(v.number()),
    hostedState: v.optional(v.string()),
  },
  returns: v.object({
    personId: v.id('persons'),
    connection: connectionDocument,
  }),
  handler: async (ctx, { groupId, expectedGeneration, hostedState }) => {
    const { person } = await requireAuth(ctx);
    if (
      hostedState &&
      (await loadJourney(ctx, hostedState)).groupId !== groupId
    )
      throw new Error('Connection request does not match this Group.');
    const connection = await eligibleConnection(ctx, groupId, person._id);
    if (
      expectedGeneration !== undefined &&
      expectedGeneration !== connection.generation
    )
      throw new Error('Discord configuration changed. Start Connect again.');
    return { personId: person._id, connection };
  },
});
export const begin = internalMutation({
  args: {
    groupId: v.id('groups'),
    discordUserId: v.string(),
    fresh: v.optional(v.boolean()),
    expectedGeneration: v.optional(v.number()),
    hostedState: v.optional(v.string()),
  },
  returns: enrollmentDocument,
  handler: async (
    ctx,
    { groupId, discordUserId, fresh, expectedGeneration, hostedState }
  ) => {
    const { person } = await requireAuth(ctx);
    if (
      hostedState &&
      (await loadJourney(ctx, hostedState)).groupId !== groupId
    )
      throw new Error('Connection request does not match this Group.');
    const connection = await eligibleConnection(ctx, groupId, person._id);
    if (
      expectedGeneration !== undefined &&
      expectedGeneration !== connection.generation
    )
      throw new Error('Discord configuration changed. Start Connect again.');
    return beginEnrollment(ctx, groupId, person._id, discordUserId, fresh);
  },
});
export const fence = internalQuery({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  returns: v.union(enrollmentDocument, v.null()),
  handler: async (ctx, { enrollmentId, generation }) => {
    const row = await ctx.db.get(enrollmentId);
    if (!row || row.generation !== generation || row.desired !== 'granted')
      return null;
    return (await enrollmentAuthorized(ctx, row)) ? row : null;
  },
});
export const finish = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
    status: v.union(
      v.literal('connected'),
      v.literal('screening'),
      v.literal('blocked')
    ),
    error: v.optional(v.string()),
    externalException: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (!row || row.generation !== args.generation || row.desired !== 'granted')
      return false;
    const current = await enrollmentAuthorized(ctx, row);
    if (!current) return false;
    await ctx.db.patch(row._id, {
      status: args.status,
      connectPending: false,
      error: args.error,
      externalException: args.externalException,
      updatedAt: Date.now(),
      nextObservationAt: Date.now() + 300000,
      nextAttemptAt: Date.now(),
      lastObservedAt:
        args.status === 'blocked' ? row.lastObservedAt : Date.now(),
      attempts: row.attempts + 1,
    });
    return true;
  },
});

export const cancelUnconsented = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { enrollmentId, generation }) => {
    const row = await ctx.db.get(enrollmentId);
    if (row?.generation === generation && row.status === 'pending') {
      if (row.grantAttemptedAt) {
        await oweAccessCleanup(ctx, row);
        await ctx.db.patch(row._id, {
          desired: 'removed',
          status: 'blocked',
          connectPending: false,
          error:
            'Discord join outcome is uncertain. Cleanup must complete before fresh Connect.',
        });
      } else await ctx.db.delete(enrollmentId);
    }
  },
});

export const scheduleGrant = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
    delay: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (
      !row ||
      row.generation !== args.generation ||
      row.desired !== 'granted' ||
      row.status === 'connected' ||
      !(await enrollmentAuthorized(ctx, row))
    )
      return;
    const nextAttemptAt = Date.now() + (args.delay ?? 0);
    await ctx.db.patch(row._id, {
      status: 'pending',
      connectPending: false,
      nextAttemptAt,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      args.delay ?? 0,
      internal.groupDiscord.grant.run,
      { enrollmentId: row._id, generation: row.generation }
    );
  },
});
export const claimGrant = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  returns: v.union(enrollmentDocument, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (
      !row ||
      row.generation !== args.generation ||
      row.desired !== 'granted' ||
      row.status !== 'pending' ||
      row.connectPending ||
      row.nextAttemptAt > Date.now()
    )
      return null;
    if (Date.now() - (row.lastObservedAt ?? row.startedAt) >= 45 * 86400000) {
      if (row.grantAttemptedAt) {
        const cleanupId = await oweAccessCleanup(ctx, row);
        await ctx.db.patch(cleanupId, {
          error:
            'Discord moderation history coverage expired. Cleanup is pending before fresh Connect.',
        });
      }
      await ctx.db.patch(row._id, {
        status: 'blocked',
        desired: 'removed',
        generation: row.generation + 1,
        error:
          'Discord moderation history coverage expired. Connect again after synchronization recovers.',
        nextObservationAt: Date.now(),
      });
      await notifySynchronizationBlocked(ctx, row.groupId);
      return null;
    }
    const current = await enrollmentAuthorized(ctx, row);
    if (!current) {
      if (row.grantAttemptedAt) await oweAccessCleanup(ctx, row);
      await ctx.db.patch(row._id, {
        status: 'blocked',
        desired: 'removed',
        error: 'Group access changed. Connect again.',
      });
      return null;
    }
    // Persist a lease before any provider write; a scheduled continuation recovers process loss.
    await ctx.db.patch(row._id, {
      nextAttemptAt: Date.now() + 60000,
      attempts: row.attempts + 1,
    });
    await ctx.scheduler.runAfter(60000, internal.groupDiscord.grant.run, args);
    return row;
  },
});
export const oweCleanup = internalMutation({
  args: {
    groupId: v.id('groups'),
    guildId: v.string(),
    discordUserId: v.string(),
    roleId: v.optional(v.string()),
    mode: v.optional(v.union(v.literal('role'), v.literal('membership'))),
    generation: v.number(),
    connectionGeneration: v.optional(v.number()),
    personId: v.optional(v.id('persons')),
  },
  returns: v.union(v.id('groupDiscordCleanup'), v.null()),
  handler: async (ctx, args) => {
    if (args.personId) {
      const current = await ctx.db
        .query('groupDiscordEnrollments')
        .withIndex('by_group_person', q =>
          q.eq('groupId', args.groupId).eq('personId', args.personId!)
        )
        .unique();
      // A newer explicit consent owns this exact target. Creating cleanup before replacement
      // blocks it transactionally; observing replacement first must preserve its authorized access.
      if (
        current &&
        current.generation > args.generation &&
        current.guildId === args.guildId &&
        current.discordUserId === args.discordUserId &&
        current.roleId === args.roleId &&
        (await enrollmentAuthorized(ctx, current))
      )
        return null;
    }
    return oweAccessCleanup(ctx, args);
  },
});

export const markGrantAttempt = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (!row || row.generation !== args.generation || row.desired !== 'granted')
      return false;
    const current = await enrollmentAuthorized(ctx, row);
    if (!current) return false;
    await ctx.db.patch(row._id, { grantAttemptedAt: Date.now() });
    return true;
  },
});

export const completeCompensation = internalMutation({
  args: { cleanupId: v.id('groupDiscordCleanup') },
  returns: v.null(),
  handler: async (ctx, { cleanupId }) => {
    const obligation = await ctx.db.get(cleanupId);
    if (obligation?.desired === 'role_removed')
      await ctx.db.patch(cleanupId, {
        observed: 'absent',
        status: 'completed',
        error: undefined,
        updatedAt: Date.now(),
      });
  },
});

/** Persist continuation of explicit Connect, without storing provider credentials. */
export const scheduleConnect = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
    delay: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (
      !row ||
      row.generation !== args.generation ||
      !(await enrollmentAuthorized(ctx, row))
    )
      return null;
    await ctx.db.patch(row._id, {
      status: 'pending',
      connectPending: true,
      nextAttemptAt: Date.now() + args.delay,
    });
    await ctx.scheduler.runAfter(
      args.delay,
      internal.groupDiscord.connect.resume,
      { enrollmentId: row._id, generation: row.generation }
    );
    return null;
  },
});
export const claimConnect = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
  returns: v.union(
    v.object({ row: enrollmentDocument, userId: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (
      !row ||
      row.generation !== args.generation ||
      row.status !== 'pending' ||
      !row.connectPending ||
      row.nextAttemptAt > Date.now()
    )
      return null;
    if (Date.now() - (row.lastObservedAt ?? row.startedAt) >= 45 * 86400000) {
      if (row.grantAttemptedAt) await oweAccessCleanup(ctx, row);
      await ctx.db.patch(row._id, {
        desired: 'removed',
        status: 'blocked',
        connectPending: false,
        error:
          'Discord moderation history coverage expired. Connect again after synchronization recovers.',
      });
      await notifySynchronizationBlocked(ctx, row.groupId);
      return null;
    }
    if (!(await enrollmentAuthorized(ctx, row))) {
      if (row.grantAttemptedAt) await oweAccessCleanup(ctx, row);
      await ctx.db.patch(row._id, {
        desired: 'removed',
        status: 'blocked',
        connectPending: false,
      });
      return null;
    }
    const person = await ctx.db.get(row.personId);
    if (!person) return null;
    await ctx.db.patch(row._id, { nextAttemptAt: Date.now() + 10 * 60 * 1000 });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.groupDiscord.connect.resume,
      args
    );
    return { row, userId: person.userId };
  },
});

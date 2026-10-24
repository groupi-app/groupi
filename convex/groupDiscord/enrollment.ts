import { query, internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { internal } from '../_generated/api';
import {
  eligibleConnection,
  oweRoleCleanup,
  beginEnrollment,
  enrollmentAuthorized,
  getMemberStatus,
} from './memberOperations';
import { memberStatus } from './contracts';
export const getStatus = query({
  args: { groupId: v.id('groups') },
  returns: v.union(memberStatus, v.null()),
  handler: async (ctx, { groupId }) => {
    const { person } = await requireAuth(ctx);
    return getMemberStatus(ctx, groupId, person._id);
  },
});
export const context = internalQuery({
  args: { groupId: v.id('groups') },
  handler: async (ctx, { groupId }) => {
    const { person } = await requireAuth(ctx);
    return {
      personId: person._id,
      connection: await eligibleConnection(ctx, groupId, person._id),
    };
  },
});
export const begin = internalMutation({
  args: {
    groupId: v.id('groups'),
    discordUserId: v.string(),
    fresh: v.optional(v.boolean()),
  },
  handler: async (ctx, { groupId, discordUserId, fresh }) => {
    const { person } = await requireAuth(ctx);
    return beginEnrollment(ctx, groupId, person._id, discordUserId, fresh);
  },
});
export const fence = internalQuery({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
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
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (!row || row.generation !== args.generation || row.desired !== 'granted')
      return false;
    const current = await enrollmentAuthorized(ctx, row);
    if (!current) return false;
    await ctx.db.patch(row._id, {
      status: args.status,
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
  handler: async (ctx, { enrollmentId, generation }) => {
    const row = await ctx.db.get(enrollmentId);
    if (row?.generation === generation && row.status === 'pending')
      await ctx.db.delete(enrollmentId);
  },
});

export const scheduleGrant = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
    delay: v.optional(v.number()),
  },
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
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.enrollmentId);
    if (
      !row ||
      row.generation !== args.generation ||
      row.desired !== 'granted' ||
      row.status !== 'pending' ||
      row.nextAttemptAt > Date.now()
    )
      return null;
    const current = await enrollmentAuthorized(ctx, row);
    if (!current) {
      if (row.grantAttemptedAt) await oweRoleCleanup(ctx, row);
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
    roleId: v.string(),
    generation: v.number(),
    connectionGeneration: v.optional(v.number()),
    personId: v.optional(v.id('persons')),
  },
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
    return oweRoleCleanup(ctx, args);
  },
});

export const markGrantAttempt = internalMutation({
  args: {
    enrollmentId: v.id('groupDiscordEnrollments'),
    generation: v.number(),
  },
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

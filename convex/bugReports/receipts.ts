import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { getCurrentPerson } from '../auth';
import { internalMutation, type MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { result } from './contracts';

function outcome(receipt: Doc<'bugReportReceipts'>) {
  if (receipt.status === 'accepted')
    return { status: 'accepted' as const, eventId: receipt.eventId };
  if (receipt.status === 'in-progress')
    return receipt.leaseUntil > Date.now()
      ? {
          status: 'in-progress' as const,
          retryAfterMs: Math.min(5000, receipt.leaseUntil - Date.now()),
        }
      : { status: 'outcome-unknown' as const, code: 'interrupted' };
  if (receipt.status === 'outcome-unknown')
    return {
      status: 'outcome-unknown' as const,
      code: receipt.code ?? 'network-uncertain',
    };
  return {
    status: 'failed' as const,
    code: receipt.code ?? 'upstream-rejected',
    ...(receipt.retryAt
      ? { retryAfterMs: Math.max(0, receipt.retryAt - Date.now()) }
      : {}),
  };
}

async function consume(ctx: MutationCtx, key: string, limit: number) {
  const now = Date.now();
  const current = await ctx.db
    .query('bugReportRateLimits')
    .withIndex('by_key', q => q.eq('key', key))
    .unique();
  const attempts = (current?.attempts ?? []).filter(
    time => time > now - 600_000
  );
  if (attempts.length >= limit) return Math.max(1, attempts[0] + 600_000 - now);
  attempts.push(now);
  if (current)
    await ctx.db.patch(current._id, { attempts, expiresAt: now + 600_000 });
  else
    await ctx.db.insert('bugReportRateLimits', {
      key,
      attempts,
      expiresAt: now + 600_000,
    });
  return 0;
}

export const reserve = internalMutation({
  args: {
    submissionId: v.string(),
    payloadDigest: v.string(),
    eventId: v.string(),
    networkKey: v.string(),
  },
  returns: v.union(
    v.object({ kind: v.literal('reserved'), eventId: v.string() }),
    v.object({ kind: v.literal('result'), result })
  ),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('bugReportReceipts')
      .withIndex('by_submissionId', q =>
        q.eq('submissionId', args.submissionId)
      )
      .unique();
    if (existing) {
      if (existing.payloadDigest !== args.payloadDigest)
        return {
          kind: 'result' as const,
          result: { status: 'failed' as const, code: 'submission-conflict' },
        };
      if (existing.status !== 'failed' || (existing.retryAt ?? 0) > Date.now())
        return { kind: 'result' as const, result: outcome(existing) };
    }
    const active = await ctx.db
      .query('bugReportReceipts')
      .withIndex('by_status_and_leaseUntil', q =>
        q.eq('status', 'in-progress').gt('leaseUntil', Date.now())
      )
      .take(8);
    if (active.length >= 8)
      return {
        kind: 'result' as const,
        result: { status: 'failed' as const, code: 'busy', retryAfterMs: 5000 },
      };
    const person = await getCurrentPerson(ctx);
    const identityKey = person
      ? `person:${person._id}`
      : `anonymous:${args.networkKey}`;
    const retryAfterMs = await consume(ctx, identityKey, 5);
    if (retryAfterMs)
      return {
        kind: 'result' as const,
        result: {
          status: 'failed' as const,
          code: 'rate-limited',
          retryAfterMs,
        },
      };
    const networkRetry = await consume(ctx, `network:${args.networkKey}`, 20);
    if (networkRetry)
      return {
        kind: 'result' as const,
        result: {
          status: 'failed' as const,
          code: 'rate-limited',
          retryAfterMs: networkRetry,
        },
      };
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'in-progress',
        code: undefined,
        retryAt: undefined,
        leaseUntil: Date.now() + 120_000,
        expiresAt: Date.now() + 86_400_000,
      });
      return { kind: 'reserved' as const, eventId: existing.eventId };
    }
    await ctx.db.insert('bugReportReceipts', {
      submissionId: args.submissionId,
      payloadDigest: args.payloadDigest,
      eventId: args.eventId,
      status: 'in-progress',
      leaseUntil: Date.now() + 120_000,
      expiresAt: Date.now() + 86_400_000,
    });
    return { kind: 'reserved' as const, eventId: args.eventId };
  },
});

export const finish = internalMutation({
  args: { submissionId: v.string(), eventId: v.string(), outcome: result },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('bugReportReceipts')
      .withIndex('by_submissionId', q =>
        q.eq('submissionId', args.submissionId)
      )
      .unique();
    if (
      !existing ||
      existing.eventId !== args.eventId ||
      existing.status === 'accepted'
    )
      return null;
    const next = args.outcome;
    if (
      next.status === 'accepted' ||
      next.status === 'failed' ||
      next.status === 'outcome-unknown'
    ) {
      await ctx.db.patch(existing._id, {
        status: next.status,
        code: 'code' in next ? next.code : undefined,
        retryAt:
          next.status === 'failed' && next.retryAfterMs
            ? Date.now() + next.retryAfterMs
            : undefined,
      });
    }
    return null;
  },
});

export const lookup = internalMutation({
  args: { submissionId: v.string(), networkKey: v.string() },
  returns: result,
  handler: async (ctx, args) => {
    const retryAfterMs = await consume(ctx, `lookup:${args.networkKey}`, 60);
    if (retryAfterMs)
      return { status: 'failed' as const, code: 'rate-limited', retryAfterMs };
    const receipt = await ctx.db
      .query('bugReportReceipts')
      .withIndex('by_submissionId', q =>
        q.eq('submissionId', args.submissionId)
      )
      .unique();
    if (!receipt || receipt.expiresAt <= Date.now())
      return { status: 'not-found' as const };
    return outcome(receipt);
  },
});

/** Bounded technical-metadata retention; never schedules report delivery. */
export const prune = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    for (const table of ['bugReportReceipts', 'bugReportRateLimits'] as const) {
      const expired = await ctx.db
        .query(table)
        .withIndex('by_expiresAt', q => q.lt('expiresAt', Date.now()))
        .take(256);
      for (const row of expired) await ctx.db.delete(row._id);
      if (expired.length === 256)
        await ctx.scheduler.runAfter(0, internal.bugReports.receipts.prune, {});
    }
    return null;
  },
});

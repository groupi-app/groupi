import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { internalMutation } from '../_generated/server';

export const TERMINAL_DELIVERY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const INACTIVE_TOKEN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const STALE_DELIVERY_AGE_MS = 24 * 60 * 60 * 1000;
export const RETENTION_BATCH_SIZE = 100;
export const RETENTION_MAX_BATCHES = 100;

const terminalStatusValidator = v.union(
  v.literal('TICKET_ERROR'),
  v.literal('RECEIPT_OK'),
  v.literal('RECEIPT_ERROR')
);

const terminalStatuses = [
  'TICKET_ERROR',
  'RECEIPT_OK',
  'RECEIPT_ERROR',
] as const;

const staleStatuses = [
  'PENDING',
  'SENDING',
  'RETRY_SCHEDULED',
  'TICKET_OK',
] as const;

/** Start independent, bounded retention workers from the daily cron. */
export const startRetentionCleanup = internalMutation({
  args: {},
  returns: v.object({ scheduledWorkers: v.number() }),
  handler: async ctx => {
    const now = Date.now();

    await Promise.all([
      ...terminalStatuses.map(status =>
        ctx.scheduler.runAfter(
          0,
          internal.pushNotifications.retention.pruneTerminalDeliveries,
          {
            status,
            cutoff: now - TERMINAL_DELIVERY_RETENTION_MS,
            remainingBatches: RETENTION_MAX_BATCHES,
          }
        )
      ),
      ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.retention.pruneInactiveTokenGenerations,
        {
          cutoff: now - INACTIVE_TOKEN_RETENTION_MS,
          remainingBatches: RETENTION_MAX_BATCHES,
        }
      ),
      ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.retention.reportStaleDeliveries,
        { cutoff: now - STALE_DELIVERY_AGE_MS }
      ),
    ]);

    return { scheduledWorkers: terminalStatuses.length + 2 };
  },
});

/** Delete one indexed batch of terminal delivery audit history. */
export const pruneTerminalDeliveries = internalMutation({
  args: {
    status: terminalStatusValidator,
    cutoff: v.number(),
    remainingBatches: v.number(),
  },
  returns: v.object({
    deleted: v.number(),
    scheduledNext: v.boolean(),
  }),
  handler: async (ctx, { status, cutoff, remainingBatches }) => {
    const deliveries = await ctx.db
      .query('pushDeliveries')
      .withIndex('by_status_and_updated_at', q =>
        q.eq('status', status).lt('updatedAt', cutoff)
      )
      .take(RETENTION_BATCH_SIZE);

    await Promise.all(deliveries.map(delivery => ctx.db.delete(delivery._id)));

    const scheduledNext =
      deliveries.length === RETENTION_BATCH_SIZE && remainingBatches > 1;
    if (scheduledNext) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.retention.pruneTerminalDeliveries,
        { status, cutoff, remainingBatches: remainingBatches - 1 }
      );
    } else {
      console.info('Push delivery retention batch chain finished', {
        status,
        deletedInFinalBatch: deliveries.length,
        reachedBatchLimit:
          deliveries.length === RETENTION_BATCH_SIZE && remainingBatches <= 1,
      });
    }

    return { deleted: deliveries.length, scheduledNext };
  },
});

/**
 * Delete deliveries before their old inactive token generation. Processing a
 * single token per mutation keeps both reads and writes bounded even if one
 * generation accumulated unusually large delivery history.
 */
export const pruneInactiveTokenGenerations = internalMutation({
  args: {
    cutoff: v.number(),
    remainingBatches: v.number(),
  },
  returns: v.object({
    deletedDeliveries: v.number(),
    deletedTokens: v.number(),
    scheduledNext: v.boolean(),
  }),
  handler: async (ctx, { cutoff, remainingBatches }) => {
    const token = await ctx.db
      .query('pushTokens')
      .withIndex('by_active_and_deactivated_at', q =>
        q
          .eq('active', false)
          .gte('deactivatedAt', 0)
          .lt('deactivatedAt', cutoff)
      )
      .first();

    if (!token) {
      console.info('Inactive push token retention batch chain finished', {
        deletedDeliveriesInFinalBatch: 0,
        deletedTokensInFinalBatch: 0,
        reachedBatchLimit: false,
      });
      return {
        deletedDeliveries: 0,
        deletedTokens: 0,
        scheduledNext: false,
      };
    }

    const deliveries = await ctx.db
      .query('pushDeliveries')
      .withIndex('by_push_token', q => q.eq('pushTokenId', token._id))
      .take(RETENTION_BATCH_SIZE);
    await Promise.all(deliveries.map(delivery => ctx.db.delete(delivery._id)));

    const deletedTokens = deliveries.length < RETENTION_BATCH_SIZE ? 1 : 0;
    if (deletedTokens === 1) {
      await ctx.db.delete(token._id);
    }

    const scheduledNext = remainingBatches > 1;
    if (scheduledNext) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.retention.pruneInactiveTokenGenerations,
        { cutoff, remainingBatches: remainingBatches - 1 }
      );
    } else {
      console.info('Inactive push token retention batch chain finished', {
        deletedDeliveriesInFinalBatch: deliveries.length,
        deletedTokensInFinalBatch: deletedTokens,
        reachedBatchLimit: true,
      });
    }

    return {
      deletedDeliveries: deliveries.length,
      deletedTokens,
      scheduledNext,
    };
  },
});

/** Report stale nonterminal work without deleting evidence needed for recovery. */
export const reportStaleDeliveries = internalMutation({
  args: { cutoff: v.number() },
  returns: v.object({
    pending: v.number(),
    sending: v.number(),
    retryScheduled: v.number(),
    ticketOk: v.number(),
    sampleLimitReached: v.boolean(),
  }),
  handler: async (ctx, { cutoff }) => {
    const sampleLimit = RETENTION_BATCH_SIZE + 1;
    const counts = await Promise.all(
      staleStatuses.map(async status => {
        const deliveries = await ctx.db
          .query('pushDeliveries')
          .withIndex('by_status_and_updated_at', q =>
            q.eq('status', status).lt('updatedAt', cutoff)
          )
          .take(sampleLimit);
        return deliveries.length;
      })
    );
    const [pending, sending, retryScheduled, ticketOk] = counts;
    const sampleLimitReached = counts.some(count => count === sampleLimit);

    if (counts.some(count => count > 0)) {
      console.warn('Stale nonterminal push deliveries detected', {
        pending,
        sending,
        retryScheduled,
        ticketOk,
        sampleLimitReached,
      });
    }

    return {
      pending,
      sending,
      retryScheduled,
      ticketOk,
      sampleLimitReached,
    };
  },
});

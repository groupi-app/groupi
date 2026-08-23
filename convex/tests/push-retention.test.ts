import { describe, expect, test, vi } from 'vitest';
import { internal } from '../_generated/api';
import {
  RETENTION_BATCH_SIZE,
  STALE_DELIVERY_AGE_MS,
} from '../pushNotifications/retention';
import { createTestInstance, TestScenarios } from './test_helpers';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Push notification retention', () => {
  test('schedules independent bounded cleanup and monitoring workers', async () => {
    vi.useFakeTimers();
    const t = createTestInstance();
    try {
      await expect(
        t.mutation(
          internal.pushNotifications.retention.startRetentionCleanup,
          {}
        )
      ).resolves.toEqual({ scheduledWorkers: 5 });

      const scheduled = await t.run(ctx =>
        ctx.db.system.query('_scheduled_functions').collect()
      );
      expect(scheduled).toHaveLength(5);
      expect(scheduled.every(job => job.state.kind === 'pending')).toBe(true);

      await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    } finally {
      vi.useRealTimers();
    }
  });

  test('deletes only terminal delivery history older than the cutoff', async () => {
    const t = createTestInstance();
    const { personId } = await TestScenarios.simpleUser(t);
    const cutoff = Date.now() - 30 * DAY_MS;

    const ids = await t.run(async ctx => {
      const tokenId = await ctx.db.insert('pushTokens', {
        personId,
        token: 'ExpoPushToken[retention-active]',
        deviceId: 'retention-active-device',
        platform: 'ios',
        active: true,
        lastRegisteredAt: cutoff - DAY_MS,
        createdAt: cutoff - DAY_MS,
        updatedAt: cutoff - DAY_MS,
      });
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      const insertDelivery = (
        status: 'TICKET_ERROR' | 'RECEIPT_OK' | 'RECEIPT_ERROR' | 'PENDING',
        updatedAt: number
      ) =>
        ctx.db.insert('pushDeliveries', {
          notificationId,
          pushTokenId: tokenId,
          title: 'Retention title',
          body: 'Retention body',
          destination: 'notifications',
          status,
          attempts: 1,
          receiptCheckAttempts: 1,
          createdAt: updatedAt,
          updatedAt,
        });

      return {
        oldTicketError: await insertDelivery('TICKET_ERROR', cutoff - 1),
        oldReceiptOk: await insertDelivery('RECEIPT_OK', cutoff - 1),
        oldReceiptError: await insertDelivery('RECEIPT_ERROR', cutoff - 1),
        boundaryReceiptOk: await insertDelivery('RECEIPT_OK', cutoff),
        oldPending: await insertDelivery('PENDING', cutoff - DAY_MS),
      };
    });

    for (const status of [
      'TICKET_ERROR',
      'RECEIPT_OK',
      'RECEIPT_ERROR',
    ] as const) {
      await t.mutation(
        internal.pushNotifications.retention.pruneTerminalDeliveries,
        { status, cutoff, remainingBatches: 1 }
      );
    }

    const remaining = await t.run(async ctx => ({
      oldTicketError: await ctx.db.get(ids.oldTicketError),
      oldReceiptOk: await ctx.db.get(ids.oldReceiptOk),
      oldReceiptError: await ctx.db.get(ids.oldReceiptError),
      boundaryReceiptOk: await ctx.db.get(ids.boundaryReceiptOk),
      oldPending: await ctx.db.get(ids.oldPending),
    }));
    expect(remaining).toEqual({
      oldTicketError: null,
      oldReceiptOk: null,
      oldReceiptError: null,
      boundaryReceiptOk: expect.objectContaining({ status: 'RECEIPT_OK' }),
      oldPending: expect.objectContaining({ status: 'PENDING' }),
    });
  });

  test('batches dependent delivery deletion before pruning an inactive token', async () => {
    const t = createTestInstance();
    const { personId } = await TestScenarios.simpleUser(t);
    const cutoff = Date.now() - 30 * DAY_MS;

    const { oldTokenId, activeTokenId, recentTokenId } = await t.run(
      async ctx => {
        const oldTokenId = await ctx.db.insert('pushTokens', {
          personId,
          token: 'ExpoPushToken[retention-old]',
          deviceId: 'retention-old-device',
          platform: 'android',
          active: false,
          lastRegisteredAt: cutoff - DAY_MS,
          deactivatedAt: cutoff - 1,
          createdAt: cutoff - DAY_MS,
          updatedAt: cutoff - 1,
        });
        const activeTokenId = await ctx.db.insert('pushTokens', {
          personId,
          token: 'ExpoPushToken[retention-current]',
          deviceId: 'retention-current-device',
          platform: 'ios',
          active: true,
          lastRegisteredAt: cutoff - DAY_MS,
          deactivatedAt: cutoff - DAY_MS,
          createdAt: cutoff - DAY_MS,
          updatedAt: cutoff - DAY_MS,
        });
        const recentTokenId = await ctx.db.insert('pushTokens', {
          personId,
          token: 'ExpoPushToken[retention-recent]',
          deviceId: 'retention-recent-device',
          platform: 'ios',
          active: false,
          lastRegisteredAt: cutoff + DAY_MS,
          deactivatedAt: cutoff + DAY_MS,
          createdAt: cutoff + DAY_MS,
          updatedAt: cutoff + DAY_MS,
        });
        const notificationId = await ctx.db.insert('notifications', {
          personId,
          type: 'EVENT_EDITED',
          read: false,
        });

        await Promise.all(
          Array.from({ length: RETENTION_BATCH_SIZE + 1 }, (_, index) =>
            ctx.db.insert('pushDeliveries', {
              notificationId,
              pushTokenId: oldTokenId,
              title: `Retention title ${index}`,
              body: 'Retention body',
              destination: 'notifications',
              status: 'PENDING',
              attempts: 0,
              receiptCheckAttempts: 0,
              createdAt: cutoff - DAY_MS,
              updatedAt: cutoff - DAY_MS,
            })
          )
        );

        return { oldTokenId, activeTokenId, recentTokenId };
      }
    );

    await expect(
      t.mutation(
        internal.pushNotifications.retention.pruneInactiveTokenGenerations,
        { cutoff, remainingBatches: 1 }
      )
    ).resolves.toEqual({
      deletedDeliveries: RETENTION_BATCH_SIZE,
      deletedTokens: 0,
      scheduledNext: false,
    });

    let state = await t.run(async ctx => ({
      oldToken: await ctx.db.get(oldTokenId),
      deliveries: await ctx.db
        .query('pushDeliveries')
        .withIndex('by_push_token', q => q.eq('pushTokenId', oldTokenId))
        .collect(),
    }));
    expect(state.oldToken).not.toBeNull();
    expect(state.deliveries).toHaveLength(1);

    await expect(
      t.mutation(
        internal.pushNotifications.retention.pruneInactiveTokenGenerations,
        { cutoff, remainingBatches: 1 }
      )
    ).resolves.toEqual({
      deletedDeliveries: 1,
      deletedTokens: 1,
      scheduledNext: false,
    });

    state = await t.run(async ctx => ({
      oldToken: await ctx.db.get(oldTokenId),
      deliveries: await ctx.db
        .query('pushDeliveries')
        .withIndex('by_push_token', q => q.eq('pushTokenId', oldTokenId))
        .collect(),
    }));
    expect(state).toEqual({ oldToken: null, deliveries: [] });

    const preservedTokens = await t.run(async ctx => ({
      active: await ctx.db.get(activeTokenId),
      recent: await ctx.db.get(recentTokenId),
    }));
    expect(preservedTokens.active).toMatchObject({ active: true });
    expect(preservedTokens.recent).toMatchObject({ active: false });

    await expect(
      t.mutation(
        internal.pushNotifications.retention.pruneInactiveTokenGenerations,
        { cutoff, remainingBatches: 1 }
      )
    ).resolves.toEqual({
      deletedDeliveries: 0,
      deletedTokens: 0,
      scheduledNext: false,
    });
  });

  test('reports stale nonterminal deliveries without deleting them', async () => {
    const t = createTestInstance();
    const { personId } = await TestScenarios.simpleUser(t);
    const cutoff = Date.now() - STALE_DELIVERY_AGE_MS;

    await t.run(async ctx => {
      const tokenId = await ctx.db.insert('pushTokens', {
        personId,
        token: 'ExpoPushToken[retention-monitor]',
        deviceId: 'retention-monitor-device',
        platform: 'ios',
        active: true,
        lastRegisteredAt: cutoff,
        createdAt: cutoff,
        updatedAt: cutoff,
      });
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'EVENT_EDITED',
        read: false,
      });

      for (const status of [
        'PENDING',
        'SENDING',
        'RETRY_SCHEDULED',
        'TICKET_OK',
      ] as const) {
        await ctx.db.insert('pushDeliveries', {
          notificationId,
          pushTokenId: tokenId,
          title: 'Retention monitor title',
          body: 'Retention monitor body',
          destination: 'notifications',
          status,
          attempts: 1,
          receiptCheckAttempts: 0,
          createdAt: cutoff - 1,
          updatedAt: cutoff - 1,
        });
      }
      await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: tokenId,
        title: 'Recent delivery',
        body: 'Recent delivery body',
        destination: 'notifications',
        status: 'PENDING',
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: cutoff + 1,
        updatedAt: cutoff + 1,
      });
    });

    await expect(
      t.mutation(internal.pushNotifications.retention.reportStaleDeliveries, {
        cutoff,
      })
    ).resolves.toEqual({
      pending: 1,
      sending: 1,
      retryScheduled: 1,
      ticketOk: 1,
      sampleLimitReached: false,
    });

    const deliveries = await t.run(ctx =>
      ctx.db.query('pushDeliveries').collect()
    );
    expect(deliveries).toHaveLength(5);
  });
});

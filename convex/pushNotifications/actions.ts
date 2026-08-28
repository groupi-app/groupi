'use node';

import { makeFunctionReference } from 'convex/server';
import { v } from 'convex/values';
import {
  Expo,
  type ExpoPushErrorReceipt,
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
} from 'expo-server-sdk';
import { Id } from '../_generated/dataModel';
import { internalAction } from '../_generated/server';
import {
  classifyPushTransportError,
  getRetryDelayMs,
  isTransientPushError,
  MAX_PUSH_ATTEMPTS,
  MAX_RECEIPT_CHECK_ATTEMPTS,
  sanitizePushErrorMessage,
} from './constants';

type DeliveryJob = {
  deliveryId: Id<'pushDeliveries'>;
  token: string;
  title: string;
  body: string;
  destination: 'notifications' | 'invites' | 'friends' | 'event' | 'post';
  eventId?: Id<'events'>;
  postId?: Id<'posts'>;
  notificationId: Id<'notifications'>;
  ticketId?: string;
  attempts: number;
  receiptCheckAttempts: number;
};

type DeliveryUpdate = {
  deliveryId: Id<'pushDeliveries'>;
  status:
    | 'PENDING'
    | 'SENDING'
    | 'RETRY_SCHEDULED'
    | 'TICKET_OK'
    | 'TICKET_ERROR'
    | 'RECEIPT_OK'
    | 'RECEIPT_ERROR';
  ticketId?: string;
  errorCode?: string;
  errorMessage?: string;
  attempts?: number;
  nextAttemptAt?: number;
  receiptCheckedAt?: number;
  receiptCheckAttempts?: number;
  expectedStatus?: 'SENDING' | 'TICKET_OK';
  deactivateToken: boolean;
};

type CancelledDelivery = {
  deliveryId: Id<'pushDeliveries'>;
  attempts: number;
};

const resolveDeliveryJobsRef = makeFunctionReference<
  'query',
  { deliveryIds: Id<'pushDeliveries'>[]; purpose: 'send' | 'receipt' },
  { ready: DeliveryJob[]; cancelled: CancelledDelivery[] }
>('pushNotifications/queries:resolveDeliveryJobs');

const recordDeliveryUpdatesRef = makeFunctionReference<
  'mutation',
  { updates: DeliveryUpdate[] },
  null
>('pushNotifications/mutations:recordDeliveryUpdates');

const claimDeliveriesRef = makeFunctionReference<
  'mutation',
  { deliveryIds: Id<'pushDeliveries'>[] },
  { claimedIds: Id<'pushDeliveries'>[] }
>('pushNotifications/mutations:claimDeliveries');

function createExpoClient(): Expo {
  return new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    maxConcurrentRequests: 4,
    retryMinTimeout: 1_000,
  });
}

function getErrorMessage(error: unknown): string {
  return (
    sanitizePushErrorMessage(
      error instanceof Error ? error.message : 'Expo push request failed'
    ) ?? 'Expo push request failed'
  );
}

function getProviderError(receipt: ExpoPushErrorReceipt): string | undefined {
  return receipt.details?.error;
}

function makeMessage(job: DeliveryJob): ExpoPushMessage {
  return {
    to: job.token,
    title: job.title.slice(0, 120),
    body: job.body.slice(0, 1_000),
    sound: 'default',
    priority: 'high',
    data: {
      destination: job.destination,
      ...(job.eventId ? { eventId: job.eventId } : {}),
      ...(job.postId ? { postId: job.postId } : {}),
      notificationId: job.notificationId,
    },
  };
}

function cancelledUpdates(
  deliveries: CancelledDelivery[],
  expectedStatus: 'SENDING' | 'TICKET_OK'
): DeliveryUpdate[] {
  return deliveries.map(delivery => ({
    deliveryId: delivery.deliveryId,
    status: 'TICKET_ERROR',
    errorCode: 'DeliveryCancelled',
    errorMessage: 'Push delivery is no longer eligible',
    attempts: delivery.attempts,
    expectedStatus,
    deactivateToken: false,
  }));
}

function createSendRetryUpdates(
  jobs: DeliveryJob[],
  errorCode: string,
  errorMessage: string
): { updates: DeliveryUpdate[]; retrying: number } {
  const updates: DeliveryUpdate[] = [];
  let retrying = 0;

  for (const job of jobs) {
    const canRetry =
      isTransientPushError(errorCode) && job.attempts < MAX_PUSH_ATTEMPTS;
    if (canRetry) {
      retrying += 1;
      updates.push({
        deliveryId: job.deliveryId,
        status: 'RETRY_SCHEDULED',
        errorCode,
        errorMessage,
        attempts: job.attempts,
        nextAttemptAt: Date.now() + getRetryDelayMs(job.attempts),
        deactivateToken: false,
      });
    } else {
      updates.push({
        deliveryId: job.deliveryId,
        status: 'TICKET_ERROR',
        errorCode,
        errorMessage,
        attempts: job.attempts,
        deactivateToken: errorCode === 'DeviceNotRegistered',
      });
    }
  }

  return { updates, retrying };
}

/** Resolve fresh delivery state, then send batched Expo push messages. */
export const sendPushNotifications = internalAction({
  args: { deliveryIds: v.array(v.id('pushDeliveries')) },
  returns: v.object({
    sent: v.number(),
    failed: v.number(),
    retrying: v.number(),
  }),
  handler: async (ctx, { deliveryIds }) => {
    if (deliveryIds.length === 0) {
      return { sent: 0, failed: 0, retrying: 0 };
    }

    const { claimedIds } = await ctx.runMutation(claimDeliveriesRef, {
      deliveryIds,
    });
    if (claimedIds.length === 0) {
      return { sent: 0, failed: 0, retrying: 0 };
    }
    const resolved = await ctx.runQuery(resolveDeliveryJobsRef, {
      deliveryIds: claimedIds,
      purpose: 'send',
    });
    const expo = createExpoClient();
    const updates = cancelledUpdates(resolved.cancelled, 'SENDING');
    const validJobs: DeliveryJob[] = [];
    let sent = 0;
    let failed = resolved.cancelled.length;
    let retrying = 0;

    for (const job of resolved.ready) {
      if (Expo.isExpoPushToken(job.token)) {
        validJobs.push(job);
      } else {
        updates.push({
          deliveryId: job.deliveryId,
          status: 'TICKET_ERROR',
          errorCode: 'InvalidExpoPushToken',
          errorMessage: 'Stored Expo push token is invalid',
          attempts: job.attempts,
          deactivateToken: true,
        });
        failed += 1;
      }
    }

    for (
      let offset = 0;
      offset < validJobs.length;
      offset += Expo.pushNotificationChunkSizeLimit
    ) {
      const chunk = validJobs.slice(
        offset,
        offset + Expo.pushNotificationChunkSizeLimit
      );
      try {
        const tickets = await expo.sendPushNotificationsAsync(
          chunk.map(makeMessage)
        );
        for (let index = 0; index < tickets.length; index += 1) {
          const job = chunk[index];
          const ticket: ExpoPushTicket | undefined = tickets[index];
          if (!job || !ticket) continue;

          if (ticket.status === 'ok') {
            updates.push({
              deliveryId: job.deliveryId,
              status: 'TICKET_OK',
              ticketId: ticket.id,
              attempts: job.attempts,
              receiptCheckAttempts: 0,
              deactivateToken: false,
            });
            sent += 1;
          } else {
            const errorCode = getProviderError(ticket) ?? 'ExpoTicketError';
            const retryResult = createSendRetryUpdates(
              [job],
              errorCode,
              sanitizePushErrorMessage(ticket.message) ?? 'Expo ticket error'
            );
            updates.push(...retryResult.updates);
            retrying += retryResult.retrying;
            if (retryResult.retrying === 0) failed += 1;
          }
        }
      } catch (error) {
        const errorCode = classifyPushTransportError(error);
        const retryResult = createSendRetryUpdates(
          chunk,
          errorCode,
          getErrorMessage(error)
        );
        updates.push(...retryResult.updates);
        retrying += retryResult.retrying;
        failed += chunk.length - retryResult.retrying;
        console.error(
          `Expo push batch failed (${errorCode}); ${retryResult.retrying} queued for retry`
        );
      }
    }

    if (updates.length > 0) {
      await ctx.runMutation(recordDeliveryUpdatesRef, { updates });
    }

    return { sent, failed, retrying };
  },
});

/** Check receipts and retry only provider errors classified as transient. */
export const checkPushReceipts = internalAction({
  args: { deliveryIds: v.array(v.id('pushDeliveries')) },
  returns: v.object({
    checked: v.number(),
    pending: v.number(),
    failed: v.number(),
    retrying: v.number(),
  }),
  handler: async (ctx, { deliveryIds }) => {
    if (deliveryIds.length === 0) {
      return { checked: 0, pending: 0, failed: 0, retrying: 0 };
    }

    const resolved = await ctx.runQuery(resolveDeliveryJobsRef, {
      deliveryIds,
      purpose: 'receipt',
    });
    const expo = createExpoClient();
    const updates = cancelledUpdates(resolved.cancelled, 'TICKET_OK');
    const pendingIds: Id<'pushDeliveries'>[] = [];
    const retryIds: Id<'pushDeliveries'>[] = [];
    let checked = 0;
    let failed = resolved.cancelled.length;

    for (
      let offset = 0;
      offset < resolved.ready.length;
      offset += Expo.pushNotificationReceiptChunkSizeLimit
    ) {
      const chunk = resolved.ready.slice(
        offset,
        offset + Expo.pushNotificationReceiptChunkSizeLimit
      );
      try {
        const receiptMap = await expo.getPushNotificationReceiptsAsync(
          chunk.flatMap(job => (job.ticketId ? [job.ticketId] : []))
        );

        for (const job of chunk) {
          if (!job.ticketId) continue;
          const receipt: ExpoPushReceipt | undefined = receiptMap[job.ticketId];
          const checkAttempt = job.receiptCheckAttempts + 1;
          if (!receipt) {
            if (checkAttempt < MAX_RECEIPT_CHECK_ATTEMPTS) {
              pendingIds.push(job.deliveryId);
              updates.push({
                deliveryId: job.deliveryId,
                status: 'TICKET_OK',
                ticketId: job.ticketId,
                receiptCheckedAt: Date.now(),
                receiptCheckAttempts: checkAttempt,
                deactivateToken: false,
              });
            } else {
              updates.push({
                deliveryId: job.deliveryId,
                status: 'RECEIPT_ERROR',
                ticketId: job.ticketId,
                errorCode: 'ReceiptUnavailable',
                errorMessage: 'Expo push receipt was not available',
                receiptCheckedAt: Date.now(),
                receiptCheckAttempts: checkAttempt,
                deactivateToken: false,
              });
              failed += 1;
            }
            continue;
          }

          checked += 1;
          if (receipt.status === 'ok') {
            updates.push({
              deliveryId: job.deliveryId,
              status: 'RECEIPT_OK',
              ticketId: job.ticketId,
              receiptCheckedAt: Date.now(),
              receiptCheckAttempts: checkAttempt,
              deactivateToken: false,
            });
          } else {
            const errorCode = getProviderError(receipt) ?? 'ExpoReceiptError';
            if (
              isTransientPushError(errorCode) &&
              job.attempts < MAX_PUSH_ATTEMPTS
            ) {
              retryIds.push(job.deliveryId);
              updates.push({
                deliveryId: job.deliveryId,
                status: 'RETRY_SCHEDULED',
                ticketId: job.ticketId,
                errorCode,
                errorMessage:
                  sanitizePushErrorMessage(receipt.message) ??
                  'Transient Expo receipt error',
                nextAttemptAt: Date.now() + getRetryDelayMs(job.attempts),
                receiptCheckedAt: Date.now(),
                receiptCheckAttempts: checkAttempt,
                deactivateToken: false,
              });
            } else {
              updates.push({
                deliveryId: job.deliveryId,
                status: 'RECEIPT_ERROR',
                ticketId: job.ticketId,
                errorCode,
                errorMessage:
                  sanitizePushErrorMessage(receipt.message) ??
                  'Expo receipt error',
                receiptCheckedAt: Date.now(),
                receiptCheckAttempts: checkAttempt,
                deactivateToken: errorCode === 'DeviceNotRegistered',
              });
              failed += 1;
            }
          }
        }
      } catch (error) {
        const errorCode = classifyPushTransportError(error);
        console.error(`Expo receipt batch failed (${errorCode})`);
        for (const job of chunk) {
          const checkAttempt = job.receiptCheckAttempts + 1;
          if (checkAttempt < MAX_RECEIPT_CHECK_ATTEMPTS) {
            pendingIds.push(job.deliveryId);
            updates.push({
              deliveryId: job.deliveryId,
              status: 'TICKET_OK',
              ticketId: job.ticketId,
              receiptCheckedAt: Date.now(),
              receiptCheckAttempts: checkAttempt,
              deactivateToken: false,
            });
          } else {
            updates.push({
              deliveryId: job.deliveryId,
              status: 'RECEIPT_ERROR',
              ticketId: job.ticketId,
              errorCode,
              errorMessage: getErrorMessage(error),
              receiptCheckedAt: Date.now(),
              receiptCheckAttempts: checkAttempt,
              deactivateToken: false,
            });
            failed += 1;
          }
        }
      }
    }

    if (updates.length > 0) {
      await ctx.runMutation(recordDeliveryUpdatesRef, { updates });
    }
    return {
      checked,
      pending: pendingIds.length,
      failed,
      retrying: retryIds.length,
    };
  },
});

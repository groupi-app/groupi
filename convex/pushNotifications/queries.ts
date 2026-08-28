import { ConvexError, v } from 'convex/values';
import { getCurrentPerson } from '../auth';
import { internalQuery, query } from '../_generated/server';

const deviceStatusValidator = v.object({
  id: v.id('pushTokens'),
  platform: v.union(v.literal('ios'), v.literal('android')),
  active: v.boolean(),
  projectId: v.optional(v.string()),
  appId: v.optional(v.string()),
  deviceName: v.optional(v.string()),
  lastRegisteredAt: v.number(),
  updatedAt: v.number(),
});

/**
 * Return the caller's registration metadata for a device without exposing its
 * Expo push token.
 */
export const getDeviceStatus = query({
  args: { deviceId: v.string() },
  returns: v.union(deviceStatusValidator, v.null()),
  handler: async (ctx, { deviceId }) => {
    const person = await getCurrentPerson(ctx);
    if (!person) return null;
    if (deviceId.trim().length === 0 || deviceId.length > 200) {
      throw new ConvexError('Invalid device identifier');
    }

    const registrations = await ctx.db
      .query('pushTokens')
      .withIndex('by_person_and_device', q =>
        q.eq('personId', person._id).eq('deviceId', deviceId)
      )
      .order('desc')
      .collect();
    const registration =
      registrations.find(candidate => candidate.active) ?? registrations[0];

    if (!registration) return null;

    return {
      id: registration._id,
      platform: registration.platform,
      active: registration.active,
      projectId: registration.projectId,
      appId: registration.appId,
      deviceName: registration.deviceName,
      lastRegisteredAt: registration.lastRegisteredAt,
      updatedAt: registration.updatedAt,
    };
  },
});

const deliveryJobValidator = v.object({
  deliveryId: v.id('pushDeliveries'),
  token: v.string(),
  title: v.string(),
  body: v.string(),
  destination: v.union(
    v.literal('notifications'),
    v.literal('invites'),
    v.literal('friends'),
    v.literal('event'),
    v.literal('post')
  ),
  eventId: v.optional(v.id('events')),
  postId: v.optional(v.id('posts')),
  notificationId: v.id('notifications'),
  ticketId: v.optional(v.string()),
  attempts: v.number(),
  receiptCheckAttempts: v.number(),
});

const cancelledDeliveryValidator = v.object({
  deliveryId: v.id('pushDeliveries'),
  attempts: v.number(),
});

/** Resolve queued IDs against current state without exposing tokens publicly. */
export const resolveDeliveryJobs = internalQuery({
  args: {
    deliveryIds: v.array(v.id('pushDeliveries')),
    purpose: v.union(v.literal('send'), v.literal('receipt')),
  },
  returns: v.object({
    ready: v.array(deliveryJobValidator),
    cancelled: v.array(cancelledDeliveryValidator),
  }),
  handler: async (ctx, { deliveryIds, purpose }) => {
    const ready = [];
    const cancelled = [];

    for (const deliveryId of deliveryIds) {
      const delivery = await ctx.db.get(deliveryId);
      if (!delivery) continue;

      const isExpectedState =
        purpose === 'send'
          ? delivery.status === 'SENDING'
          : delivery.status === 'TICKET_OK' && delivery.ticketId !== undefined;
      if (!isExpectedState) continue;

      const [token, notification] = await Promise.all([
        ctx.db.get(delivery.pushTokenId),
        ctx.db.get(delivery.notificationId),
      ]);
      if (
        !token ||
        !token.active ||
        !notification ||
        notification.personId !== token.personId
      ) {
        cancelled.push({ deliveryId, attempts: delivery.attempts });
        continue;
      }

      ready.push({
        deliveryId,
        token: token.token,
        title: delivery.title,
        body: delivery.body,
        destination: delivery.destination,
        eventId: delivery.eventId,
        postId: delivery.postId,
        notificationId: delivery.notificationId,
        ticketId: delivery.ticketId,
        attempts: delivery.attempts,
        receiptCheckAttempts: delivery.receiptCheckAttempts,
      });
    }

    return { ready, cancelled };
  },
});

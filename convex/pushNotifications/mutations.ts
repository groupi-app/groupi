import { makeFunctionReference } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { requireAuth } from '../auth';
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import {
  isValidExpoPushToken,
  DELIVERY_LEASE_MS,
  MAX_ACTIVE_PUSH_DEVICES,
  MAX_PUSH_ATTEMPTS,
  NOTIFICATION_TYPES,
  pushDeliveryStatusValidator,
  RECEIPT_CHECK_DELAY_MS,
  sanitizePushErrorMessage,
} from './constants';

const sendPushNotificationsRef = makeFunctionReference<
  'action',
  { deliveryIds: Id<'pushDeliveries'>[] },
  { sent: number; failed: number; retrying: number }
>('pushNotifications/actions:sendPushNotifications');

const checkPushReceiptsRef = makeFunctionReference<
  'action',
  { deliveryIds: Id<'pushDeliveries'>[] },
  { checked: number; pending: number; failed: number; retrying: number }
>('pushNotifications/actions:checkPushReceipts');

const metadataValidator = v.object({
  token: v.string(),
  deviceId: v.string(),
  platform: v.union(v.literal('ios'), v.literal('android')),
  projectId: v.string(),
  appId: v.string(),
  deviceName: v.optional(v.string()),
});

function validateMetadata(args: {
  token: string;
  deviceId: string;
  projectId: string;
  appId: string;
  deviceName?: string;
}) {
  if (!isValidExpoPushToken(args.token)) {
    throw new ConvexError('Invalid Expo push token');
  }
  if (args.deviceId.trim().length === 0 || args.deviceId.length > 200) {
    throw new ConvexError('Invalid device identifier');
  }
  if (args.projectId.trim().length === 0 || args.projectId.length > 200) {
    throw new ConvexError('Invalid Expo project identifier');
  }
  if (args.appId.trim().length === 0 || args.appId.length > 200) {
    throw new ConvexError('Invalid application identifier');
  }
  if (args.deviceName && args.deviceName.length > 200) {
    throw new ConvexError('Invalid device name');
  }

  const allowedProjectIds = (process.env.EXPO_ALLOWED_PROJECT_IDS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'test' && allowedProjectIds.length === 0) {
    throw new ConvexError('Expo project allowlist is not configured');
  }
  if (
    allowedProjectIds.length > 0 &&
    !allowedProjectIds.includes(args.projectId)
  ) {
    throw new ConvexError('Expo project is not allowed');
  }
  const allowedAppIds = (process.env.EXPO_ALLOWED_APP_IDS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'test' && allowedAppIds.length === 0) {
    throw new ConvexError('Application allowlist is not configured');
  }
  if (allowedAppIds.length > 0 && !allowedAppIds.includes(args.appId)) {
    throw new ConvexError('Application identifier is not allowed');
  }
}

async function ensurePushNotificationMethod(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  now: number
): Promise<Id<'notificationMethods'>> {
  let personSettings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', personId))
    .first();

  if (!personSettings) {
    const settingsId = await ctx.db.insert('personSettings', {
      personId,
      updatedAt: now,
    });
    personSettings = await ctx.db.get(settingsId);
  }

  if (!personSettings) {
    throw new ConvexError('Unable to create notification settings');
  }

  const methods = await ctx.db
    .query('notificationMethods')
    .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
    .collect();
  const pushMethods = methods.filter(method => method.type === 'PUSH');
  let pushMethod = pushMethods[0];

  if (!pushMethod) {
    const methodId = await ctx.db.insert('notificationMethods', {
      settingsId: personSettings._id,
      type: 'PUSH',
      enabled: true,
      name: 'Native push',
      value: 'Native push notifications',
      updatedAt: now,
    });
    const createdMethod = await ctx.db.get(methodId);
    if (!createdMethod) {
      throw new ConvexError('Unable to create push notification method');
    }
    pushMethod = createdMethod;
  } else if (
    pushMethod.value !== 'Native push notifications' ||
    pushMethod.name === undefined
  ) {
    await ctx.db.patch(pushMethod._id, {
      name: pushMethod.name ?? 'Native push',
      value: 'Native push notifications',
      updatedAt: now,
    });
  }

  // Older clients could create one PUSH method per device. Keep a single
  // account-level preference method and retire duplicates without deleting
  // their historical settings.
  await Promise.all(
    pushMethods.slice(1).map(method =>
      ctx.db.patch(method._id, {
        enabled: false,
        value: 'Native push notifications',
        updatedAt: now,
      })
    )
  );

  const existingSettings = await ctx.db
    .query('notificationSettings')
    .withIndex('by_method', q => q.eq('methodId', pushMethod._id))
    .collect();
  const configuredTypes = new Set(
    existingSettings.map(setting => setting.notificationType)
  );

  await Promise.all(
    NOTIFICATION_TYPES.filter(type => !configuredTypes.has(type)).map(type =>
      ctx.db.insert('notificationSettings', {
        notificationType: type,
        methodId: pushMethod._id,
        enabled: true,
        updatedAt: now,
      })
    )
  );

  return pushMethod._id;
}

/** Register or refresh the caller's per-device Expo push token. */
export const registerDevice = mutation({
  args: metadataValidator.fields,
  returns: v.object({ id: v.id('pushTokens'), created: v.boolean() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    validateMetadata(args);

    const now = Date.now();
    await ensurePushNotificationMethod(ctx, person._id, now);

    const [deviceRegistrations, tokenRegistrations, activeRegistrations] =
      await Promise.all([
        ctx.db
          .query('pushTokens')
          .withIndex('by_person_and_device', q =>
            q.eq('personId', person._id).eq('deviceId', args.deviceId)
          )
          .order('desc')
          .collect(),
        ctx.db
          .query('pushTokens')
          .withIndex('by_token', q => q.eq('token', args.token))
          .collect(),
        ctx.db
          .query('pushTokens')
          .withIndex('by_person_and_active', q =>
            q.eq('personId', person._id).eq('active', true)
          )
          .collect(),
      ]);
    const deviceRegistration = deviceRegistrations.find(
      registration => registration.active && registration.token === args.token
    );

    // A token belongs to one installed app at a time. If a user signs out and
    // another signs in on the device, transfer the token without leaving the
    // previous account reachable. Deactivate every conflicting legacy row,
    // rather than assuming the unique invariant was always enforced.
    const conflictingRegistrations = new Map(
      [...deviceRegistrations, ...tokenRegistrations]
        .filter(
          registration =>
            registration._id !== deviceRegistration?._id && registration.active
        )
        .map(registration => [registration._id, registration])
    );
    const remainingActiveRegistrations = activeRegistrations.filter(
      registration =>
        registration._id !== deviceRegistration?._id &&
        !conflictingRegistrations.has(registration._id)
    );
    // Reserve one active slot for this registration (existing or newly inserted).
    const allowedRemainingCount = MAX_ACTIVE_PUSH_DEVICES - 1;
    const excessCount = Math.max(
      0,
      remainingActiveRegistrations.length - allowedRemainingCount
    );
    for (const registration of remainingActiveRegistrations.slice(
      0,
      excessCount
    )) {
      conflictingRegistrations.set(registration._id, registration);
    }
    await Promise.all(
      [...conflictingRegistrations.values()].map(registration =>
        ctx.db.patch(registration._id, {
          active: false,
          deactivatedAt: now,
          updatedAt: now,
        })
      )
    );

    if (deviceRegistration) {
      await ctx.db.patch(deviceRegistration._id, {
        platform: args.platform,
        projectId: args.projectId,
        appId: args.appId,
        deviceName: args.deviceName,
        active: true,
        lastRegisteredAt: now,
        deactivatedAt: undefined,
        updatedAt: now,
      });
      return { id: deviceRegistration._id, created: false };
    }

    const id = await ctx.db.insert('pushTokens', {
      personId: person._id,
      token: args.token,
      deviceId: args.deviceId,
      platform: args.platform,
      projectId: args.projectId,
      appId: args.appId,
      deviceName: args.deviceName,
      active: true,
      lastRegisteredAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { id, created: true };
  },
});

/** Disable the caller's registration for a device. */
export const unregisterDevice = mutation({
  args: { deviceId: v.string() },
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx, { deviceId }) => {
    const { person } = await requireAuth(ctx);
    if (deviceId.trim().length === 0 || deviceId.length > 200) {
      throw new ConvexError('Invalid device identifier');
    }
    const registrations = await ctx.db
      .query('pushTokens')
      .withIndex('by_person_and_device', q =>
        q.eq('personId', person._id).eq('deviceId', deviceId)
      )
      .collect();
    const activeRegistrations = registrations.filter(
      registration => registration.active
    );

    if (activeRegistrations.length === 0) return { removed: false };

    const now = Date.now();
    await Promise.all(
      activeRegistrations.map(registration =>
        ctx.db.patch(registration._id, {
          active: false,
          deactivatedAt: now,
          updatedAt: now,
        })
      )
    );
    return { removed: true };
  },
});

const deliveryUpdateValidator = v.object({
  deliveryId: v.id('pushDeliveries'),
  status: pushDeliveryStatusValidator,
  ticketId: v.optional(v.string()),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  attempts: v.optional(v.number()),
  nextAttemptAt: v.optional(v.number()),
  receiptCheckedAt: v.optional(v.number()),
  receiptCheckAttempts: v.optional(v.number()),
  expectedStatus: v.optional(
    v.union(v.literal('SENDING'), v.literal('TICKET_OK'))
  ),
  deactivateToken: v.boolean(),
});

/** Atomically lease eligible deliveries before any provider request. */
export const claimDeliveries = internalMutation({
  args: { deliveryIds: v.array(v.id('pushDeliveries')) },
  returns: v.object({ claimedIds: v.array(v.id('pushDeliveries')) }),
  handler: async (ctx, { deliveryIds }) => {
    const now = Date.now();
    const claimedIds: Id<'pushDeliveries'>[] = [];

    for (const deliveryId of deliveryIds) {
      const delivery = await ctx.db.get(deliveryId);
      if (!delivery) continue;

      const isEligible =
        delivery.status === 'PENDING' ||
        (delivery.status === 'RETRY_SCHEDULED' &&
          (delivery.nextAttemptAt === undefined ||
            delivery.nextAttemptAt <= now)) ||
        (delivery.status === 'SENDING' &&
          delivery.leaseExpiresAt !== undefined &&
          delivery.leaseExpiresAt <= now);
      if (!isEligible) continue;

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
        await ctx.db.patch(deliveryId, {
          status: 'TICKET_ERROR',
          errorCode: 'DeliveryCancelled',
          errorMessage: 'Push delivery is no longer eligible',
          leaseExpiresAt: undefined,
          nextAttemptAt: undefined,
          updatedAt: now,
        });
        continue;
      }

      if (delivery.attempts >= MAX_PUSH_ATTEMPTS) {
        await ctx.db.patch(deliveryId, {
          status: 'TICKET_ERROR',
          errorCode: 'RetryLimitExceeded',
          errorMessage: 'Push delivery retry limit reached',
          leaseExpiresAt: undefined,
          nextAttemptAt: undefined,
          updatedAt: now,
        });
        continue;
      }

      await ctx.db.patch(deliveryId, {
        status: 'SENDING',
        attempts: delivery.attempts + 1,
        leaseExpiresAt: now + DELIVERY_LEASE_MS,
        nextAttemptAt: undefined,
        updatedAt: now,
      });
      claimedIds.push(deliveryId);
    }

    if (claimedIds.length > 0) {
      await ctx.scheduler.runAfter(
        DELIVERY_LEASE_MS,
        sendPushNotificationsRef,
        {
          deliveryIds: claimedIds,
        }
      );
    }

    return { claimedIds };
  },
});

/** Persist provider state from the Node action in one transaction. */
export const recordDeliveryUpdates = internalMutation({
  args: { updates: v.array(deliveryUpdateValidator) },
  returns: v.null(),
  handler: async (ctx, { updates }) => {
    const now = Date.now();

    for (const update of updates) {
      const delivery = await ctx.db.get(update.deliveryId);
      if (!delivery) continue;
      if (update.expectedStatus && delivery.status !== update.expectedStatus) {
        continue;
      }
      if (update.receiptCheckedAt !== undefined) {
        const isNextReceiptCheck =
          update.receiptCheckAttempts === delivery.receiptCheckAttempts + 1;
        if (
          delivery.status !== 'TICKET_OK' ||
          update.ticketId !== delivery.ticketId ||
          !isNextReceiptCheck
        ) {
          continue;
        }
      }
      if (
        update.attempts !== undefined &&
        update.attempts !== delivery.attempts
      ) {
        continue;
      }

      const patch: Partial<Doc<'pushDeliveries'>> = {
        status: update.status,
        leaseExpiresAt: undefined,
        updatedAt: now,
      };
      if (update.attempts !== undefined) patch.attempts = update.attempts;
      if (update.status === 'TICKET_OK' || update.status === 'RECEIPT_OK') {
        patch.errorCode = undefined;
        patch.errorMessage = undefined;
        patch.nextAttemptAt = undefined;
      }
      if (update.ticketId !== undefined) patch.ticketId = update.ticketId;
      if (update.errorCode !== undefined) patch.errorCode = update.errorCode;
      if (update.errorMessage !== undefined) {
        patch.errorMessage = sanitizePushErrorMessage(update.errorMessage);
      }
      if (update.nextAttemptAt !== undefined) {
        patch.nextAttemptAt = update.nextAttemptAt;
      }
      if (update.receiptCheckedAt !== undefined) {
        patch.receiptCheckedAt = update.receiptCheckedAt;
      }
      if (update.receiptCheckAttempts !== undefined) {
        patch.receiptCheckAttempts = update.receiptCheckAttempts;
      }

      await ctx.db.patch(delivery._id, patch);

      if (update.status === 'TICKET_OK') {
        await ctx.scheduler.runAfter(
          RECEIPT_CHECK_DELAY_MS,
          checkPushReceiptsRef,
          { deliveryIds: [delivery._id] }
        );
      } else if (update.status === 'RETRY_SCHEDULED') {
        await ctx.scheduler.runAfter(
          Math.max(0, (update.nextAttemptAt ?? now) - now),
          sendPushNotificationsRef,
          { deliveryIds: [delivery._id] }
        );
      }

      if (update.deactivateToken) {
        const [token, notification] = await Promise.all([
          ctx.db.get(delivery.pushTokenId),
          ctx.db.get(delivery.notificationId),
        ]);
        if (
          token?.active &&
          notification &&
          notification.personId === token.personId
        ) {
          await ctx.db.patch(token._id, {
            active: false,
            deactivatedAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return null;
  },
});

import { describe, expect, test } from 'vitest';
import { api, internal } from '../_generated/api';
import {
  classifyPushTransportError,
  getRetryDelayMs,
  isTransientPushError,
  isValidExpoPushToken,
  NOTIFICATION_TYPES,
  sanitizePushErrorMessage,
} from '../pushNotifications/constants';
import { collectPushData } from '../lib/notifications';
import { cascadeDeleteEventData } from '../lib/cascade';
import { createTestInstance, TestScenarios } from './test_helpers';

const TOKEN_A = 'ExpoPushToken[test-device-token-a]';
const TOKEN_B = 'ExponentPushToken[test-device-token-b]';
const REGISTRATION_METADATA = {
  projectId: 'project-a',
  appId: 'gg.groupi.mobile',
} as const;

describe('Native push notifications', () => {
  test('requires authentication to register a device', async () => {
    const t = createTestInstance();

    await expect(
      t.mutation(api.pushNotifications.mutations.registerDevice, {
        token: TOKEN_A,
        deviceId: 'device-a',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      })
    ).rejects.toThrow('Authentication required');
  });

  test('rejects registrations outside the configured project and app allowlists', async () => {
    const originalProjectIds = process.env.EXPO_ALLOWED_PROJECT_IDS;
    const originalAppIds = process.env.EXPO_ALLOWED_APP_IDS;
    process.env.EXPO_ALLOWED_PROJECT_IDS = 'project-a';
    process.env.EXPO_ALLOWED_APP_IDS = 'com.groupi.mobile';

    try {
      const t = createTestInstance();
      const { auth } = await TestScenarios.simpleUser(t);

      await expect(
        auth.mutation(api.pushNotifications.mutations.registerDevice, {
          token: TOKEN_A,
          deviceId: 'foreign-project-device',
          platform: 'ios',
          projectId: 'project-b',
          appId: 'com.groupi.mobile',
        })
      ).rejects.toThrow('Expo project is not allowed');

      await expect(
        auth.mutation(api.pushNotifications.mutations.registerDevice, {
          token: TOKEN_A,
          deviceId: 'foreign-app-device',
          platform: 'ios',
          projectId: 'project-a',
          appId: 'com.example.foreign',
        })
      ).rejects.toThrow('Application identifier is not allowed');
    } finally {
      if (originalProjectIds === undefined) {
        delete process.env.EXPO_ALLOWED_PROJECT_IDS;
      } else {
        process.env.EXPO_ALLOWED_PROJECT_IDS = originalProjectIds;
      }
      if (originalAppIds === undefined) {
        delete process.env.EXPO_ALLOWED_APP_IDS;
      } else {
        process.env.EXPO_ALLOWED_APP_IDS = originalAppIds;
      }
    }
  });

  test('idempotently registers a device and creates all push preferences', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);

    const first = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'device-a',
        platform: 'ios',
        projectId: 'project-a',
        appId: 'gg.groupi.mobile',
        deviceName: 'Test iPhone',
      }
    );
    const second = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'device-a',
        platform: 'ios',
        projectId: 'project-a',
        appId: 'gg.groupi.mobile',
      }
    );

    expect(first.created).toBe(true);
    expect(second).toEqual({ id: first.id, created: false });

    const rotated = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_B,
        deviceId: 'device-a',
        platform: 'ios',
        projectId: 'project-a',
        appId: 'gg.groupi.mobile',
      }
    );
    expect(rotated.created).toBe(true);
    expect(rotated.id).not.toBe(first.id);

    const status = await auth.query(
      api.pushNotifications.queries.getDeviceStatus,
      { deviceId: 'device-a' }
    );
    expect(status).toMatchObject({
      id: rotated.id,
      active: true,
      platform: 'ios',
      projectId: 'project-a',
      appId: 'gg.groupi.mobile',
    });
    expect(status).not.toHaveProperty('token');

    const state = await t.run(async ctx => {
      const tokens = await ctx.db
        .query('pushTokens')
        .withIndex('by_person', q => q.eq('personId', personId))
        .collect();
      const personSettings = await ctx.db
        .query('personSettings')
        .withIndex('by_person', q => q.eq('personId', personId))
        .first();
      const methods = personSettings
        ? await ctx.db
            .query('notificationMethods')
            .withIndex('by_settings', q =>
              q.eq('settingsId', personSettings._id)
            )
            .collect()
        : [];
      const pushMethod = methods.find(method => method.type === 'PUSH');
      const preferences = pushMethod
        ? await ctx.db
            .query('notificationSettings')
            .withIndex('by_method', q => q.eq('methodId', pushMethod._id))
            .collect()
        : [];
      return { tokens, pushMethod, preferences };
    });

    expect(state.tokens).toHaveLength(2);
    expect(state.tokens.find(token => token.active)?.token).toBe(TOKEN_B);
    expect(state.tokens.find(token => token._id === first.id)?.active).toBe(
      false
    );
    expect(state.pushMethod?.value).toBe('Native push notifications');
    expect(state.pushMethod?.value).not.toContain('PushToken[');
    expect(state.preferences).toHaveLength(NOTIFICATION_TYPES.length);
    expect(
      new Set(state.preferences.map(item => item.notificationType))
    ).toEqual(new Set(NOTIFICATION_TYPES));
  });

  test('unregister only disables a device owned by the caller', async () => {
    const t = createTestInstance();
    const first = await TestScenarios.simpleUser(t);
    const second = await TestScenarios.simpleUser(t);

    await first.auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: TOKEN_A,
      deviceId: 'shared-device-id',
      platform: 'android',
      ...REGISTRATION_METADATA,
    });

    expect(
      await second.auth.mutation(
        api.pushNotifications.mutations.unregisterDevice,
        { deviceId: 'shared-device-id' }
      )
    ).toEqual({ removed: false });
    expect(
      await first.auth.query(api.pushNotifications.queries.getDeviceStatus, {
        deviceId: 'shared-device-id',
      })
    ).toMatchObject({ active: true });

    expect(
      await first.auth.mutation(
        api.pushNotifications.mutations.unregisterDevice,
        { deviceId: 'shared-device-id' }
      )
    ).toEqual({ removed: true });
    expect(
      await first.auth.mutation(
        api.pushNotifications.mutations.unregisterDevice,
        { deviceId: 'shared-device-id' }
      )
    ).toEqual({ removed: false });
  });

  test('bounds device identifiers for unregister and status lookups', async () => {
    const t = createTestInstance();
    const { auth } = await TestScenarios.simpleUser(t);

    await expect(
      auth.mutation(api.pushNotifications.mutations.unregisterDevice, {
        deviceId: '',
      })
    ).rejects.toThrow('Invalid device identifier');
    await expect(
      auth.query(api.pushNotifications.queries.getDeviceStatus, {
        deviceId: 'x'.repeat(201),
      })
    ).rejects.toThrow('Invalid device identifier');
  });

  test('transfers a reused Expo token away from the previous account', async () => {
    const t = createTestInstance();
    const first = await TestScenarios.simpleUser(t);
    const second = await TestScenarios.simpleUser(t);

    await first.auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: TOKEN_A,
      deviceId: 'first-device',
      platform: 'ios',
      ...REGISTRATION_METADATA,
    });
    await second.auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: TOKEN_A,
      deviceId: 'second-device',
      platform: 'ios',
      ...REGISTRATION_METADATA,
    });

    const registrations = await t.run(ctx =>
      ctx.db
        .query('pushTokens')
        .withIndex('by_token', q => q.eq('token', TOKEN_A))
        .collect()
    );
    expect(registrations).toHaveLength(2);
    expect(
      registrations.find(item => item.personId === first.personId)?.active
    ).toBe(false);
    expect(
      registrations.find(item => item.personId === second.personId)?.active
    ).toBe(true);
  });

  test('deactivates every conflicting token and device row during reassignment', async () => {
    const t = createTestInstance();
    const current = await TestScenarios.simpleUser(t);
    const previousA = await TestScenarios.simpleUser(t);
    const previousB = await TestScenarios.simpleUser(t);

    await t.run(async ctx => {
      const now = Date.now();
      const common = {
        platform: 'ios' as const,
        active: true,
        lastRegisteredAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await ctx.db.insert('pushTokens', {
        ...common,
        personId: current.personId,
        token: 'ExpoPushToken[old-device-token-a]',
        deviceId: 'target-device',
      });
      await ctx.db.insert('pushTokens', {
        ...common,
        personId: current.personId,
        token: 'ExpoPushToken[old-device-token-b]',
        deviceId: 'target-device',
      });
      await ctx.db.insert('pushTokens', {
        ...common,
        personId: previousA.personId,
        token: TOKEN_A,
        deviceId: 'previous-device-a',
      });
      await ctx.db.insert('pushTokens', {
        ...common,
        personId: previousB.personId,
        token: TOKEN_A,
        deviceId: 'previous-device-b',
      });
    });

    await current.auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'target-device',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );

    const state = await t.run(async ctx => {
      const tokenRows = await ctx.db
        .query('pushTokens')
        .withIndex('by_token', q => q.eq('token', TOKEN_A))
        .collect();
      const deviceRows = await ctx.db
        .query('pushTokens')
        .withIndex('by_person_and_device', q =>
          q.eq('personId', current.personId).eq('deviceId', 'target-device')
        )
        .collect();
      return { tokenRows, deviceRows };
    });

    expect(state.tokenRows.filter(row => row.active)).toHaveLength(1);
    expect(state.tokenRows.find(row => row.active)?.personId).toBe(
      current.personId
    );
    expect(state.deviceRows.filter(row => row.active)).toHaveLength(1);
  });

  test('caps active registrations and delivery fanout at ten devices', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);

    for (let index = 0; index < 12; index += 1) {
      await auth.mutation(api.pushNotifications.mutations.registerDevice, {
        token: `ExpoPushToken[quota-token-${index}]`,
        deviceId: `quota-device-${index}`,
        platform: 'android',
        ...REGISTRATION_METADATA,
      });
    }

    const activeTokens = await t.run(ctx =>
      ctx.db
        .query('pushTokens')
        .withIndex('by_person_and_active', q =>
          q.eq('personId', personId).eq('active', true)
        )
        .collect()
    );
    expect(activeTokens).toHaveLength(10);
    expect(
      activeTokens.some(token => token.deviceId === 'quota-device-0')
    ).toBe(false);
  });

  test('atomically claims a delivery only once and rejects cross-owner jobs', async () => {
    const t = createTestInstance();
    const first = await TestScenarios.simpleUser(t);
    const second = await TestScenarios.simpleUser(t);
    const registration = await first.auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'claim-device',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );
    const { validDeliveryId, invalidDeliveryId } = await t.run(async ctx => {
      const validNotificationId = await ctx.db.insert('notifications', {
        personId: first.personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      const invalidNotificationId = await ctx.db.insert('notifications', {
        personId: second.personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      const delivery = {
        pushTokenId: registration.id,
        title: 'Event updated',
        body: 'An event was updated',
        destination: 'notifications' as const,
        status: 'PENDING' as const,
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const validDeliveryId = await ctx.db.insert('pushDeliveries', {
        ...delivery,
        notificationId: validNotificationId,
      });
      const invalidDeliveryId = await ctx.db.insert('pushDeliveries', {
        ...delivery,
        notificationId: invalidNotificationId,
      });
      return { validDeliveryId, invalidDeliveryId };
    });

    const firstClaim = await t.mutation(
      internal.pushNotifications.mutations.claimDeliveries,
      { deliveryIds: [validDeliveryId, invalidDeliveryId] }
    );
    const duplicateClaim = await t.mutation(
      internal.pushNotifications.mutations.claimDeliveries,
      { deliveryIds: [validDeliveryId] }
    );
    expect(firstClaim.claimedIds).toEqual([validDeliveryId]);
    expect(duplicateClaim.claimedIds).toEqual([]);

    const deliveries = await t.run(async ctx => ({
      valid: await ctx.db.get(validDeliveryId),
      invalid: await ctx.db.get(invalidDeliveryId),
    }));
    expect(deliveries.valid).toMatchObject({ status: 'SENDING', attempts: 1 });
    expect(deliveries.valid?.leaseExpiresAt).toBeGreaterThan(Date.now());
    expect(deliveries.invalid).toMatchObject({
      status: 'TICKET_ERROR',
      errorCode: 'DeliveryCancelled',
    });
  });

  test('rejects a stale provider update after an expired lease is reclaimed', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);
    const registration = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'lease-device',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );
    const deliveryId = await t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      return await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: registration.id,
        title: 'Event updated',
        body: 'An event was updated',
        destination: 'notifications',
        status: 'PENDING',
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(internal.pushNotifications.mutations.claimDeliveries, {
      deliveryIds: [deliveryId],
    });
    await t.run(ctx =>
      ctx.db.patch(deliveryId, { leaseExpiresAt: Date.now() - 1 })
    );
    await t.mutation(internal.pushNotifications.mutations.claimDeliveries, {
      deliveryIds: [deliveryId],
    });

    await t.mutation(
      internal.pushNotifications.mutations.recordDeliveryUpdates,
      {
        updates: [
          {
            deliveryId,
            status: 'TICKET_OK',
            ticketId: 'stale-ticket',
            attempts: 1,
            deactivateToken: false,
          },
        ],
      }
    );

    const delivery = await t.run(ctx => ctx.db.get(deliveryId));
    expect(delivery).toMatchObject({ status: 'SENDING', attempts: 2 });
    expect(delivery?.ticketId).toBeUndefined();
  });

  test('filters push collection by the per-type PUSH preference', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);
    await auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: TOKEN_A,
      deviceId: 'device-a',
      platform: 'android',
      ...REGISTRATION_METADATA,
    });

    const result = await t.run(async ctx => {
      const personSettings = await ctx.db
        .query('personSettings')
        .withIndex('by_person', q => q.eq('personId', personId))
        .first();
      if (!personSettings) throw new Error('Missing settings');
      const pushMethod = (
        await ctx.db
          .query('notificationMethods')
          .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
          .collect()
      ).find(method => method.type === 'PUSH');
      if (!pushMethod) throw new Error('Missing push method');
      const newPostSetting = await ctx.db
        .query('notificationSettings')
        .withIndex('by_type_method', q =>
          q.eq('notificationType', 'NEW_POST').eq('methodId', pushMethod._id)
        )
        .first();
      if (!newPostSetting) throw new Error('Missing preference');

      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'NEW_POST',
        read: false,
      });
      await ctx.db.patch(newPostSetting._id, { enabled: false });
      const disabled = await collectPushData(ctx, notificationId, {
        personId,
        type: 'NEW_POST',
      });
      await ctx.db.patch(newPostSetting._id, { enabled: true });
      const enabled = await collectPushData(ctx, notificationId, {
        personId,
        type: 'NEW_POST',
      });
      const delivery = enabled[0]
        ? await ctx.db.get(enabled[0].deliveryId)
        : null;
      return { disabled, enabled, delivery };
    });

    expect(result.disabled).toEqual([]);
    expect(result.enabled).toHaveLength(1);
    expect(result.enabled[0]).toMatchObject({
      deliveryId: expect.any(String),
    });
    expect(result.enabled[0]).not.toHaveProperty('token');
    expect(result.delivery).toMatchObject({
      destination: 'notifications',
      notificationId: expect.any(String),
      title: expect.any(String),
      body: expect.any(String),
    });
  });

  test('deactivates DeviceNotRegistered tokens when recording provider state', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);
    const registration = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'device-a',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );
    const { notificationId, deliveryId } = await t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      const deliveryId = await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: registration.id,
        title: 'Event updated',
        body: 'An event was updated',
        destination: 'notifications',
        status: 'TICKET_OK',
        ticketId: 'ticket-a',
        attempts: 1,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { notificationId, deliveryId };
    });

    const rotated = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_B,
        deviceId: 'device-a',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );

    await t.mutation(
      internal.pushNotifications.mutations.recordDeliveryUpdates,
      {
        updates: [
          {
            deliveryId,
            status: 'RECEIPT_ERROR',
            ticketId: 'ticket-a',
            errorCode: 'DeviceNotRegistered',
            errorMessage: `${TOKEN_A} is no longer registered`,
            attempts: 1,
            receiptCheckedAt: Date.now(),
            receiptCheckAttempts: 1,
            deactivateToken: true,
          },
        ],
      }
    );

    const state = await t.run(async ctx => ({
      oldToken: await ctx.db.get(registration.id),
      newToken: await ctx.db.get(rotated.id),
      deliveries: await ctx.db
        .query('pushDeliveries')
        .withIndex('by_notification', q =>
          q.eq('notificationId', notificationId)
        )
        .collect(),
    }));
    expect(state.oldToken?.active).toBe(false);
    expect(state.newToken?.active).toBe(true);
    expect(state.deliveries[0]).toMatchObject({
      status: 'RECEIPT_ERROR',
      errorCode: 'DeviceNotRegistered',
      errorMessage: '[redacted-push-token] is no longer registered',
    });
  });

  test('keeps receipt updates monotonic across duplicate checks', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);
    const registration = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'receipt-race-device',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );
    const deliveryId = await t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      return await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: registration.id,
        title: 'Event updated',
        body: 'An event was updated',
        destination: 'notifications',
        status: 'TICKET_OK',
        ticketId: 'receipt-race-ticket',
        attempts: 1,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const record = (status: 'TICKET_OK' | 'RECEIPT_OK', checkAttempt: number) =>
      t.mutation(internal.pushNotifications.mutations.recordDeliveryUpdates, {
        updates: [
          {
            deliveryId,
            status,
            ticketId: 'receipt-race-ticket',
            receiptCheckedAt: Date.now(),
            receiptCheckAttempts: checkAttempt,
            deactivateToken: false,
          },
        ],
      });

    await record('TICKET_OK', 1);
    await record('RECEIPT_OK', 1);
    expect(await t.run(ctx => ctx.db.get(deliveryId))).toMatchObject({
      status: 'TICKET_OK',
      receiptCheckAttempts: 1,
    });

    await record('RECEIPT_OK', 2);
    await record('TICKET_OK', 3);
    expect(await t.run(ctx => ctx.db.get(deliveryId))).toMatchObject({
      status: 'RECEIPT_OK',
      receiptCheckAttempts: 2,
    });
  });

  test('deletes delivery history with individual and bulk notification deletion', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);
    const registration = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'notification-delete-device',
        platform: 'android',
        ...REGISTRATION_METADATA,
      }
    );
    const { firstNotificationId, secondNotificationId } = await t.run(
      async ctx => {
        const firstNotificationId = await ctx.db.insert('notifications', {
          personId,
          type: 'EVENT_EDITED',
          read: false,
        });
        const secondNotificationId = await ctx.db.insert('notifications', {
          personId,
          type: 'NEW_POST',
          read: false,
        });
        const delivery = {
          pushTokenId: registration.id,
          title: 'A notification',
          body: 'Notification body',
          destination: 'notifications' as const,
          status: 'PENDING' as const,
          attempts: 0,
          receiptCheckAttempts: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await ctx.db.insert('pushDeliveries', {
          ...delivery,
          notificationId: firstNotificationId,
        });
        await ctx.db.insert('pushDeliveries', {
          ...delivery,
          notificationId: secondNotificationId,
        });
        return { firstNotificationId, secondNotificationId };
      }
    );

    await auth.mutation(api.notifications.mutations.deleteNotification, {
      notificationId: firstNotificationId,
    });
    expect(
      await t.run(ctx =>
        ctx.db
          .query('pushDeliveries')
          .withIndex('by_notification', q =>
            q.eq('notificationId', firstNotificationId)
          )
          .collect()
      )
    ).toEqual([]);
    expect(await t.run(ctx => ctx.db.get(secondNotificationId))).not.toBeNull();

    await auth.mutation(api.notifications.mutations.deleteAllNotifications, {});
    expect(
      await t.run(ctx => ctx.db.query('pushDeliveries').collect())
    ).toEqual([]);
    expect(await t.run(ctx => ctx.db.get(secondNotificationId))).toBeNull();
  });

  test('deletes push credentials and delivery history with the account', async () => {
    const t = createTestInstance();
    const { userId, personId } = await TestScenarios.simpleUser(t);
    const auth = t.withIdentity({ subject: userId, username: 'delete-me' });
    const registration = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'delete-device',
        platform: 'ios',
        ...REGISTRATION_METADATA,
      }
    );
    await t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: registration.id,
        title: 'Event updated',
        body: 'An event was updated',
        destination: 'notifications',
        status: 'PENDING',
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'delete-me',
    });

    const state = await t.run(async ctx => ({
      tokens: await ctx.db.query('pushTokens').collect(),
      deliveries: await ctx.db.query('pushDeliveries').collect(),
    }));
    expect(state.tokens).toEqual([]);
    expect(state.deliveries).toEqual([]);
  });

  test('deletes another recipient delivery tied to an authored post', async () => {
    const t = createTestInstance();
    const setup = await TestScenarios.multiUser(t);
    const registration = await setup.organizerAuth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'cross-user-delete-device',
        platform: 'android',
        ...REGISTRATION_METADATA,
      }
    );
    const { notificationId, deliveryId } = await t.run(async ctx => {
      const postId = await ctx.db.insert('posts', {
        title: 'Authored by deleting person',
        content: 'Post content',
        authorId: setup.attendee.personId,
        eventId: setup.eventId,
      });
      const notificationId = await ctx.db.insert('notifications', {
        personId: setup.organizer.personId,
        eventId: setup.eventId,
        postId,
        type: 'NEW_POST',
        read: false,
      });
      const deliveryId = await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: registration.id,
        title: 'New post',
        body: 'A new post was published',
        destination: 'post',
        eventId: setup.eventId,
        postId,
        status: 'PENDING',
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { notificationId, deliveryId };
    });

    const deletingAuthor = t.withIdentity({
      subject: setup.attendee.userId,
      username: 'delete-author',
    });
    await deletingAuthor.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'delete-author',
    });

    const state = await t.run(async ctx => ({
      notification: await ctx.db.get(notificationId),
      delivery: await ctx.db.get(deliveryId),
      recipientToken: await ctx.db.get(registration.id),
    }));
    expect(state.notification).toBeNull();
    expect(state.delivery).toBeNull();
    expect(state.recipientToken?.active).toBe(true);
  });

  test('deletes delivery history before event notifications during cascade', async () => {
    const t = createTestInstance();
    const { personId, eventId, auth } = await TestScenarios.singleEvent(t);
    const registration = await auth.mutation(
      api.pushNotifications.mutations.registerDevice,
      {
        token: TOKEN_A,
        deviceId: 'event-delete-device',
        platform: 'android',
        ...REGISTRATION_METADATA,
      }
    );
    await t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId,
        eventId,
        type: 'EVENT_EDITED',
        read: false,
      });
      await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: registration.id,
        title: 'Event updated',
        body: 'An event was updated',
        destination: 'event',
        eventId,
        status: 'PENDING',
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await cascadeDeleteEventData(ctx, eventId);
    });

    const state = await t.run(async ctx => ({
      notifications: await ctx.db.query('notifications').collect(),
      deliveries: await ctx.db.query('pushDeliveries').collect(),
    }));
    expect(state.notifications).toEqual([]);
    expect(state.deliveries).toEqual([]);
  });

  test('bounds retry helpers and redacts tokens from provider errors', () => {
    expect(getRetryDelayMs(1)).toBe(2_000);
    expect(getRetryDelayMs(99)).toBe(8_000);
    expect(isTransientPushError('MessageRateExceeded')).toBe(true);
    expect(isTransientPushError('ProviderError')).toBe(true);
    expect(isTransientPushError('DeviceNotRegistered')).toBe(false);
    expect(classifyPushTransportError(new TypeError('fetch failed'))).toBe(
      'ExpoUnavailable'
    );
    expect(
      classifyPushTransportError({
        message: 'request failed',
        cause: { code: 'ECONNRESET' },
      })
    ).toBe('ExpoUnavailable');
    const legacyUuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(isValidExpoPushToken(legacyUuid)).toBe(false);
    expect(sanitizePushErrorMessage(`Rejected ${TOKEN_A} and ${TOKEN_B}`)).toBe(
      'Rejected [redacted-push-token] and [redacted-push-token]'
    );
    expect(sanitizePushErrorMessage(`Rejected ${legacyUuid}`)).toBe(
      'Rejected [redacted-push-token]'
    );
  });
});

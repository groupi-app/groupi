import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  configureForegroundNotifications,
  getOrCreatePushDeviceId,
  getPushNotificationDestination,
  getPushNotificationId,
  getPushPermissionState,
  getPushProjectId,
  registerForPushNotifications,
} from './push-notifications';

interface MutableConstants {
  easConfig: { projectId?: string } | null;
  executionEnvironment: string;
  expoConfig: {
    extra?: Record<string, unknown>;
    ios?: { bundleIdentifier?: string };
    android?: { package?: string };
  };
}

const constants = Constants as unknown as MutableConstants;
const platform = Platform as { OS: string };

describe('push notification routing', () => {
  it('maps the server-controlled destination allowlist to native routes', () => {
    expect(
      getPushNotificationDestination({ destination: 'notifications' })
    ).toBe('/notifications');
    expect(getPushNotificationDestination({ destination: 'invites' })).toBe(
      '/invites'
    );
    expect(getPushNotificationDestination({ destination: 'friends' })).toBe(
      '/friends'
    );
    expect(
      getPushNotificationDestination({
        destination: 'event',
        eventId: 'event_123',
      })
    ).toBe('/event/event_123');
    expect(
      getPushNotificationDestination({
        destination: 'post',
        eventId: 'event-123',
        postId: 'post_456',
      })
    ).toBe('/event/event-123/post/post_456');
  });

  it('rejects arbitrary URLs and malformed identifiers', () => {
    expect(
      getPushNotificationDestination({ destination: 'https://evil.test' })
    ).toBeNull();
    expect(
      getPushNotificationDestination({
        destination: 'event',
        eventId: '../settings',
      })
    ).toBeNull();
    expect(
      getPushNotificationDestination({
        destination: 'post',
        eventId: 'event-1',
      })
    ).toBeNull();
    expect(
      getPushNotificationDestination({
        destination: 'event',
        eventId: 'a'.repeat(129),
      })
    ).toBeNull();
    expect(getPushNotificationDestination(null)).toBeNull();
  });

  it('accepts only safe notification IDs for mark-read behavior', () => {
    expect(getPushNotificationId({ notificationId: 'notification_123' })).toBe(
      'notification_123'
    );
    expect(getPushNotificationId({ notificationId: '../notification' })).toBe(
      null
    );
    expect(getPushNotificationId({ notificationId: 'a'.repeat(129) })).toBe(
      null
    );
  });
});

describe('push notification registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platform.OS = 'ios';
    constants.executionEnvironment = 'standalone';
    constants.easConfig = null;
    constants.expoConfig = {
      extra: { eas: { projectId: 'project-from-extra' } },
      ios: { bundleIdentifier: 'com.groupi.mobile' },
    };
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    vi.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({
      data: 'ExponentPushToken[test-token]',
      type: 'expo',
    });
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue('installation-123');
    vi.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
  });

  it('prefers the app config project ID and falls back to EAS config', () => {
    expect(getPushProjectId()).toBe('project-from-extra');

    constants.expoConfig.extra = {};
    constants.easConfig = { projectId: 'project-from-eas' };
    expect(getPushProjectId()).toBe('project-from-eas');

    constants.easConfig = null;
    expect(getPushProjectId()).toBeNull();
  });

  it('normalizes granted, requestable, and denied permission states', async () => {
    vi.mocked(Notifications.getPermissionsAsync)
      .mockResolvedValueOnce({
        granted: true,
        canAskAgain: true,
      } as Notifications.NotificationPermissionsStatus)
      .mockResolvedValueOnce({
        granted: false,
        canAskAgain: true,
      } as Notifications.NotificationPermissionsStatus)
      .mockResolvedValueOnce({
        granted: false,
        canAskAgain: false,
      } as Notifications.NotificationPermissionsStatus);

    await expect(getPushPermissionState()).resolves.toBe('granted');
    await expect(getPushPermissionState()).resolves.toBe('undetermined');
    await expect(getPushPermissionState()).resolves.toBe('denied');
  });

  it('registers a granted device with a stable installation ID', async () => {
    const result = await registerForPushNotifications();

    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-from-extra',
    });
    expect(result).toEqual({
      token: 'ExponentPushToken[test-token]',
      deviceId: 'installation-123',
      projectId: 'project-from-extra',
      appId: 'com.groupi.mobile',
      platform: 'ios',
    });
  });

  it('persists a new installation ID only when one does not exist', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null);

    const deviceId = await getOrCreatePushDeviceId();

    expect(deviceId).toMatch(/^install-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'groupi.push-device-id',
      deviceId
    );
  });

  it('fails before requesting an Expo token when permission is denied', async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);

    await expect(registerForPushNotifications()).rejects.toThrow(
      'Notification permission has not been granted.'
    );
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('reports a missing EAS project ID without requesting a token', async () => {
    constants.expoConfig.extra = {};

    await expect(registerForPushNotifications()).rejects.toThrow(
      'This build is missing its EAS project ID.'
    );
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('reports a missing application identifier without requesting a token', async () => {
    constants.expoConfig.ios = {};

    await expect(registerForPushNotifications()).rejects.toThrow(
      'This build is missing its native application identifier.'
    );
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('configures foreground notifications to remain visible and audible', async () => {
    configureForegroundNotifications();

    const handler = vi.mocked(Notifications.setNotificationHandler).mock
      .calls[0]?.[0];
    expect(handler).toBeDefined();
    await expect(
      handler?.handleNotification({} as Notifications.Notification)
    ).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
  });
});

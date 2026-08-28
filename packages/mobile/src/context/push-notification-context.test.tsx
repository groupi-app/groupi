import type { ReactElement, ReactNode } from 'react';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  stateSetters: [] as Array<ReturnType<typeof vi.fn>>,
  refs: [] as Array<{ current: unknown }>,
  refCursor: 0,
  isAuthenticated: true,
  sessionUserId: 'user-123',
  useMutation: vi.fn(),
  registerDevice: vi.fn(),
  unregisterDevice: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('convex/react', () => ({
  useMutation: mocks.useMutation,
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useCallback: <T,>(callback: T) => callback,
    useEffect: (effect: () => void | (() => void)) => {
      mocks.effects.push(effect);
    },
    useMemo: <T,>(factory: () => T) => factory(),
    useRef: <T,>(initial: T) => {
      const index = mocks.refCursor++;
      const existing = mocks.refs[index] as { current: T } | undefined;
      if (existing) return existing;
      const ref = { current: initial };
      mocks.refs[index] = ref;
      return ref;
    },
    useState: <T,>(initial: T) => {
      const setter = vi.fn();
      mocks.stateSetters.push(setter);
      return [initial, setter];
    },
  };
});

vi.mock('./global-user-context', () => ({
  useGlobalUser: () => ({
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    session: { user: { id: mocks.sessionUserId } },
  }),
}));

vi.mock('convex/_generated/api', () => ({
  api: {
    pushNotifications: {
      mutations: {
        registerDevice: 'registerPushDevice',
        unregisterDevice: 'unregisterPushDevice',
      },
    },
    notifications: {
      mutations: { markNotificationAsRead: 'markNotificationAsRead' },
    },
  },
}));

import {
  PushNotificationProvider,
  PushNotificationResponseHandler,
} from './push-notification-context';

interface MutableConstants {
  appOwnership: string;
  easConfig: { projectId?: string } | null;
  expoConfig: {
    extra?: Record<string, unknown>;
    ios?: { bundleIdentifier?: string };
  };
}

interface PushContextValue {
  status: string;
  permission: string;
  errorMessage: string | null;
  enable: () => Promise<void>;
  refresh: () => Promise<void>;
  unregisterThisDevice: () => Promise<void>;
}

const constants = Constants as unknown as MutableConstants;
const platform = Platform as { OS: string };

function notificationResponse(
  identifier: string,
  data: Record<string, unknown>
): Notifications.NotificationResponse {
  return {
    actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
    notification: {
      request: {
        identifier,
        content: { data },
      },
    },
  } as Notifications.NotificationResponse;
}

function createProvider() {
  mocks.refCursor = 0;
  const provider = PushNotificationProvider({
    children: null,
  }) as ReactElement<{
    children: ReactNode;
    value: PushContextValue;
  }>;
  return provider.props.value;
}

describe('PushNotificationProvider', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.effects.length = 0;
    mocks.stateSetters.length = 0;
    mocks.refs.length = 0;
    mocks.refCursor = 0;
    mocks.isAuthenticated = true;
    mocks.sessionUserId = 'user-123';
    mocks.registerDevice.mockResolvedValue(undefined);
    mocks.unregisterDevice.mockResolvedValue(undefined);
    mocks.useMutation.mockImplementation((reference: unknown) => {
      const mutation = String(reference);
      if (mutation === 'registerPushDevice') {
        return mocks.registerDevice as never;
      }
      if (mutation === 'unregisterPushDevice') {
        return mocks.unregisterDevice as never;
      }
      return mocks.markNotificationRead as never;
    });
    platform.OS = 'ios';
    constants.appOwnership = 'standalone';
    constants.easConfig = null;
    constants.expoConfig = {
      extra: { eas: { projectId: 'project-123' } },
      ios: { bundleIdentifier: 'com.groupi.mobile' },
    };
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    vi.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({
      data: 'ExponentPushToken[device-token]',
      type: 'expo',
    });
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue('installation-123');
  });

  it('surfaces denied permission without registering a device', async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);
    createProvider();

    mocks.effects[0]?.();

    await vi.waitFor(() =>
      expect(mocks.stateSetters[1]).toHaveBeenCalledWith('denied')
    );
    expect(mocks.stateSetters[0]).toHaveBeenCalledWith('denied');
    expect(mocks.registerDevice).not.toHaveBeenCalled();
  });

  it('requests permission after the first authenticated launch and registers the device', async () => {
    vi.mocked(Notifications.getPermissionsAsync)
      .mockResolvedValueOnce({
        granted: false,
        canAskAgain: true,
      } as Notifications.NotificationPermissionsStatus)
      .mockResolvedValue({
        granted: true,
        canAskAgain: true,
      } as Notifications.NotificationPermissionsStatus);
    createProvider();

    mocks.effects[0]?.();

    await vi.waitFor(() =>
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      })
    );
    await vi.waitFor(() => expect(mocks.registerDevice).toHaveBeenCalledOnce());
    expect(mocks.stateSetters[0]).toHaveBeenCalledWith('registered');
  });

  it('registers a granted token and unregisters only this installation', async () => {
    const context = createProvider();

    mocks.effects[0]?.();

    await vi.waitFor(() =>
      expect(mocks.registerDevice).toHaveBeenCalledWith({
        token: 'ExponentPushToken[device-token]',
        deviceId: 'installation-123',
        projectId: 'project-123',
        appId: 'com.groupi.mobile',
        platform: 'ios',
      })
    );
    expect(mocks.stateSetters[0]).toHaveBeenCalledWith('registered');

    await context.unregisterThisDevice();

    expect(mocks.unregisterDevice).toHaveBeenCalledWith({
      deviceId: 'installation-123',
    });
    expect(mocks.stateSetters[0]).toHaveBeenLastCalledWith('not-enabled');
  });

  it('reports a granted but misconfigured build without backend registration', async () => {
    constants.expoConfig.extra = {};
    createProvider();

    mocks.effects[0]?.();

    await vi.waitFor(() =>
      expect(mocks.stateSetters[0]).toHaveBeenLastCalledWith('misconfigured')
    );
    expect(mocks.stateSetters[2]).toHaveBeenLastCalledWith(
      'This build is missing its EAS project ID.'
    );
    expect(mocks.registerDevice).not.toHaveBeenCalled();
  });

  it('refreshes on foreground and token rotation and removes both listeners', async () => {
    vi.useFakeTimers();
    const removeAppStateListener = vi.fn();
    const removeTokenListener = vi.fn();
    let appStateListener: ((state: string) => void) | undefined;
    let tokenListener: Notifications.PushTokenListener | undefined;
    vi.mocked(AppState.addEventListener).mockImplementation(
      (_event, listener) => {
        appStateListener = listener as (state: string) => void;
        return { remove: removeAppStateListener };
      }
    );
    vi.mocked(Notifications.addPushTokenListener).mockImplementation(
      listener => {
        tokenListener = listener;
        return {
          remove: removeTokenListener,
        } as Notifications.EventSubscription;
      }
    );
    createProvider();
    const appStateCleanup = mocks.effects[1]?.();
    const tokenCleanup = mocks.effects[2]?.();

    appStateListener?.('active');
    await vi.runAllTimersAsync();
    tokenListener?.({ data: 'rotated-token', type: 'expo' });
    await vi.runAllTimersAsync();

    expect(mocks.registerDevice).toHaveBeenCalledTimes(2);
    if (typeof appStateCleanup === 'function') appStateCleanup();
    if (typeof tokenCleanup === 'function') tokenCleanup();
    expect(removeAppStateListener).toHaveBeenCalledOnce();
    expect(removeTokenListener).toHaveBeenCalledOnce();
  });

  it('serializes unregister behind an in-flight registration and suppresses rotation', async () => {
    vi.useFakeTimers();
    let finishRegistration: (() => void) | undefined;
    mocks.registerDevice.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finishRegistration = resolve;
        })
    );
    let tokenListener: Notifications.PushTokenListener | undefined;
    vi.mocked(Notifications.addPushTokenListener).mockImplementation(
      listener => {
        tokenListener = listener;
        return { remove: vi.fn() } as Notifications.EventSubscription;
      }
    );
    const context = createProvider();
    mocks.effects[0]?.();
    mocks.effects[2]?.();
    await vi.waitFor(() => expect(mocks.registerDevice).toHaveBeenCalledOnce());

    const unregister = context.unregisterThisDevice();
    await Promise.resolve();

    expect(mocks.unregisterDevice).not.toHaveBeenCalled();
    finishRegistration?.();
    await unregister;
    expect(mocks.unregisterDevice).toHaveBeenCalledWith({
      deviceId: 'installation-123',
    });
    expect(mocks.stateSetters[0]).not.toHaveBeenCalledWith('registered');

    tokenListener?.({ data: 'rotated-token', type: 'expo' });
    await vi.runAllTimersAsync();
    expect(mocks.registerDevice).toHaveBeenCalledOnce();
  });

  it('ignores an old account registration and registers the current identity', async () => {
    let finishOldRegistration: (() => void) | undefined;
    mocks.registerDevice
      .mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            finishOldRegistration = resolve;
          })
      )
      .mockResolvedValueOnce(undefined);
    createProvider();
    mocks.effects[0]?.();
    await vi.waitFor(() => expect(mocks.registerDevice).toHaveBeenCalledOnce());

    mocks.sessionUserId = 'user-456';
    createProvider();
    mocks.effects[3]?.();
    finishOldRegistration?.();

    await vi.waitFor(() =>
      expect(mocks.registerDevice).toHaveBeenCalledTimes(2)
    );
    expect(mocks.stateSetters[0]).not.toHaveBeenCalledWith('registered');
    expect(mocks.stateSetters[3]).toHaveBeenCalledWith('registered');
  });
});

describe('PushNotificationResponseHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effects.length = 0;
    mocks.stateSetters.length = 0;
    mocks.refs.length = 0;
    mocks.refCursor = 0;
    mocks.markNotificationRead.mockResolvedValue(undefined);
    mocks.useMutation.mockReturnValue(mocks.markNotificationRead);
    vi.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue(
      null
    );
  });

  it('handles cold and warm taps once and removes its response listener', async () => {
    const coldResponse = notificationResponse('cold-response', {
      destination: 'event',
      eventId: 'event-123',
      notificationId: 'notification-123',
    });
    const warmResponse = notificationResponse('warm-response', {
      destination: 'post',
      eventId: 'event-123',
      postId: 'post-456',
    });
    const removeListener = vi.fn();
    let warmListener:
      | ((response: Notifications.NotificationResponse) => void)
      | undefined;
    vi.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue(
      coldResponse
    );
    vi.mocked(
      Notifications.addNotificationResponseReceivedListener
    ).mockImplementation(listener => {
      warmListener = listener;
      return { remove: removeListener } as Notifications.EventSubscription;
    });
    PushNotificationResponseHandler();

    const coldCleanup = mocks.effects[0]?.();
    const warmCleanup = mocks.effects[1]?.();
    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/event/event-123')
    );
    expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalled();
    expect(mocks.markNotificationRead).toHaveBeenCalledWith({
      notificationId: 'notification-123',
    });

    warmListener?.(coldResponse);
    warmListener?.(warmResponse);

    expect(router.push).toHaveBeenCalledTimes(2);
    expect(router.push).toHaveBeenLastCalledWith(
      '/event/event-123/post/post-456'
    );

    if (typeof coldCleanup === 'function') coldCleanup();
    if (typeof warmCleanup === 'function') warmCleanup();
    expect(removeListener).toHaveBeenCalledOnce();
  });
});

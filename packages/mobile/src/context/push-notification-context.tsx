import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { AppState, Linking } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { useGlobalUser } from '@/context/global-user-context';
import {
  getOrCreatePushDeviceId,
  getPushNotificationDestination,
  getPushNotificationId,
  getPushPermissionState,
  isPushSupportedInThisClient,
  registerForPushNotifications,
  requestPushPermission,
  type PushPermissionState,
} from '@/lib/push-notifications';

export type PushRegistrationStatus =
  | 'checking'
  | 'not-enabled'
  | 'registering'
  | 'registered'
  | 'denied'
  | 'unsupported'
  | 'misconfigured'
  | 'error';

interface PushNotificationContextValue {
  status: PushRegistrationStatus;
  permission: PushPermissionState;
  errorMessage: string | null;
  enable: () => Promise<void>;
  refresh: () => Promise<void>;
  openSettings: () => Promise<void>;
  unregisterThisDevice: () => Promise<void>;
}

const PushNotificationContext =
  createContext<PushNotificationContextValue | null>(null);

function getRegistrationErrorStatus(message: string): PushRegistrationStatus {
  if (
    message.includes('EAS project ID') ||
    message.includes('native application identifier')
  ) {
    return 'misconfigured';
  }
  if (message.includes('development or production build')) return 'unsupported';
  return 'error';
}

export function PushNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, session } = useGlobalUser();
  const sessionUserId = session?.user.id ?? null;
  const registerDevice = useMutation(
    api.pushNotifications.mutations.registerDevice
  );
  const unregisterDevice = useMutation(
    api.pushNotifications.mutations.unregisterDevice
  );
  const [status, setStatus] = useState<PushRegistrationStatus>('checking');
  const [permission, setPermission] =
    useState<PushPermissionState>('undetermined');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const registrationInFlight = useRef<Promise<void> | null>(null);
  const registrationGeneration = useRef<number | null>(null);
  const registrationAttempt = useRef<symbol | null>(null);
  const lifecycleGeneration = useRef(0);
  const activeIdentity = useRef(
    isAuthenticated && sessionUserId ? sessionUserId : null
  );
  const registrationSuppressed = useRef(!activeIdentity.current);

  const isCurrentLifecycle = useCallback(
    (generation: number) =>
      lifecycleGeneration.current === generation &&
      !registrationSuppressed.current &&
      activeIdentity.current !== null,
    []
  );

  const refresh = useCallback(async (): Promise<void> => {
    const generation = lifecycleGeneration.current;
    if (!isCurrentLifecycle(generation)) return;

    if (!isPushSupportedInThisClient()) {
      setStatus('unsupported');
      setErrorMessage(
        'Remote push notifications require a development or production build.'
      );
      return;
    }

    let currentPermission: PushPermissionState;
    try {
      currentPermission = await getPushPermissionState();
      if (!isCurrentLifecycle(generation)) return;
      setPermission(currentPermission);
    } catch {
      if (!isCurrentLifecycle(generation)) return;
      setStatus('error');
      setErrorMessage('Groupi could not check notification permission.');
      return;
    }

    if (currentPermission !== 'granted') {
      setStatus(currentPermission === 'denied' ? 'denied' : 'not-enabled');
      setErrorMessage(null);
      return;
    }

    if (registrationInFlight.current) {
      const pendingGeneration = registrationGeneration.current;
      await registrationInFlight.current;
      if (!isCurrentLifecycle(generation)) return;
      if (pendingGeneration === generation) return;
      return refresh();
    }

    setStatus('registering');
    setErrorMessage(null);
    const attempt = Symbol('push-registration');
    registrationAttempt.current = attempt;
    registrationGeneration.current = generation;
    const registration = (async () => {
      try {
        const device = await registerForPushNotifications();
        if (!isCurrentLifecycle(generation)) return;
        await registerDevice(device);
        if (!isCurrentLifecycle(generation)) return;
        setStatus('registered');
      } catch (error) {
        if (!isCurrentLifecycle(generation)) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Groupi could not register this device.';
        setStatus(getRegistrationErrorStatus(message));
        setErrorMessage(message);
      } finally {
        if (registrationAttempt.current === attempt) {
          registrationInFlight.current = null;
          registrationGeneration.current = null;
          registrationAttempt.current = null;
        }
      }
    })();
    registrationInFlight.current = registration;
    return registration;
  }, [isCurrentLifecycle, registerDevice]);

  const resumeRegistration = useCallback(() => {
    if (!activeIdentity.current) return;
    lifecycleGeneration.current += 1;
    registrationSuppressed.current = false;
  }, []);

  const enable = useCallback(async () => {
    resumeRegistration();
    if (permission === 'denied') {
      await Linking.openSettings();
      return;
    }

    setStatus('registering');
    setErrorMessage(null);
    try {
      const result = await requestPushPermission();
      setPermission(result);
      if (result === 'granted') {
        await refresh();
      } else {
        setStatus(result === 'denied' ? 'denied' : 'not-enabled');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Groupi could not request notification permission.');
    }
  }, [permission, refresh, resumeRegistration]);

  const openSettings = useCallback(async () => {
    resumeRegistration();
    await Linking.openSettings();
  }, [resumeRegistration]);

  const unregisterThisDevice = useCallback(async () => {
    const unregisterIdentity = activeIdentity.current;
    if (!unregisterIdentity) return;
    registrationSuppressed.current = true;
    lifecycleGeneration.current += 1;
    setStatus('not-enabled');
    setErrorMessage(null);

    try {
      if (registrationInFlight.current) {
        await registrationInFlight.current;
      }
      if (activeIdentity.current !== unregisterIdentity) return;
      const deviceId = await getOrCreatePushDeviceId();
      if (activeIdentity.current !== unregisterIdentity) return;
      await unregisterDevice({ deviceId });
    } catch (error) {
      if (activeIdentity.current === unregisterIdentity) {
        setStatus('error');
        setErrorMessage('Groupi could not unregister this device.');
      }
      throw error;
    }
  }, [unregisterDevice]);

  useEffect(() => {
    const nextIdentity =
      isAuthenticated && sessionUserId ? sessionUserId : null;
    if (activeIdentity.current !== nextIdentity) {
      activeIdentity.current = nextIdentity;
      lifecycleGeneration.current += 1;
      registrationSuppressed.current = nextIdentity === null;
    }
    if (!nextIdentity) {
      setStatus('not-enabled');
      return;
    }
    void refresh();
  }, [isAuthenticated, refresh, sessionUserId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  useEffect(() => {
    if (!isPushSupportedInThisClient()) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const subscription = Notifications.addPushTokenListener(() => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void refresh(), 750);
    });
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      subscription.remove();
    };
  }, [refresh]);

  const value = useMemo<PushNotificationContextValue>(
    () => ({
      status,
      permission,
      errorMessage,
      enable,
      refresh,
      openSettings,
      unregisterThisDevice,
    }),
    [
      status,
      permission,
      errorMessage,
      enable,
      refresh,
      openSettings,
      unregisterThisDevice,
    ]
  );

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function PushNotificationResponseHandler() {
  const { isLoading: isAuthLoading } = useGlobalUser();
  const navigationState = useRootNavigationState();
  const markNotificationRead = useMutation(
    api.notifications.mutations.markNotificationAsRead
  );
  const handledResponseIds = useRef(new Set<string>());
  const isNavigationReady = Boolean(navigationState?.key) && !isAuthLoading;

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (!isNavigationReady) return false;
      const responseId = response.notification.request.identifier;
      if (handledResponseIds.current.has(responseId)) return true;

      const destination = getPushNotificationDestination(
        response.notification.request.content.data
      );
      if (!destination) return false;

      handledResponseIds.current.add(responseId);
      const notificationId = getPushNotificationId(
        response.notification.request.content.data
      );
      if (notificationId) {
        void markNotificationRead({
          notificationId: notificationId as Id<'notifications'>,
        }).catch(() => {
          // A stale or signed-out tap should never block its destination.
        });
      }
      router.push(destination as never);
      return true;
    },
    [isNavigationReady, markNotificationRead]
  );

  useEffect(() => {
    if (!isNavigationReady) return;
    let cancelled = false;
    void Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (cancelled || !response || !handleResponse(response)) return;
        void Notifications.clearLastNotificationResponseAsync().catch(() => {
          // Navigation already succeeded; clearing is best effort.
        });
      })
      .catch(() => {
        // A native response lookup failure should not affect app startup.
      });
    return () => {
      cancelled = true;
    };
  }, [handleResponse, isNavigationReady]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        handleResponse(response);
      }
    );
    return () => subscription.remove();
  }, [handleResponse]);

  return null;
}

export function usePushNotifications() {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error(
      'usePushNotifications must be used within PushNotificationProvider'
    );
  }
  return context;
}

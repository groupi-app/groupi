import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationLogger } from '@/lib/logger';

declare global {
  interface Window {
    PusherPushNotifications: typeof PusherPushNotifications;
  }
}

const PUSHER_BEAMS_INSTANCE_ID =
  process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || '';

export interface PusherBeamsState {
  isSupported: boolean;
  isRegistered: boolean;
  isSubscribed: boolean;
  isCheckingExisting: boolean;
  hasOtherUserSubscription: boolean;
  otherUserId?: string;
  error?: string;
  userId?: string;
}

export interface PusherBeamsActions {
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  getDeviceId: () => Promise<string | null>;
  checkExistingSubscription: () => Promise<void>;
}

export function usePusherBeams(): PusherBeamsState & PusherBeamsActions {
  const { user } = useUser();
  const [state, setState] = useState<PusherBeamsState>({
    isSupported: false,
    isRegistered: false,
    isSubscribed: false,
    isCheckingExisting: false,
    hasOtherUserSubscription: false,
  });

  // Use ref to store the client instance
  const beamsClientRef = useRef<PusherPushNotifications.Client | null>(null);
  const hasInitialized = useRef(false);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window;

      setState(prev => ({
        ...prev,
        isSupported,
        userId: user?.id,
      }));
    };

    checkSupport();
  }, [user?.id]);

  // Lazy initialization - only initialize when needed
  const initializeBeamsClient =
    useCallback(async (): Promise<PusherPushNotifications.Client | null> => {
      if (beamsClientRef.current) {
        return beamsClientRef.current;
      }

      if (!state.isSupported || hasInitialized.current) {
        return null;
      }

      try {
        hasInitialized.current = true;
        const client = new PusherPushNotifications.Client({
          instanceId: PUSHER_BEAMS_INSTANCE_ID,
        });

        beamsClientRef.current = client;
        return client;
      } catch (error) {
        notificationLogger.error('Failed to initialize Pusher Beams client', {
          error,
        });
        hasInitialized.current = false;
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize push notifications',
        }));
        return null;
      }
    }, [state.isSupported]);

  // Check for existing subscription without full initialization (for global restoration)
  const checkExistingSubscription = useCallback(async () => {
    if (!state.isSupported || !user?.id) {
      setState(prev => ({ ...prev, isCheckingExisting: false }));
      return;
    }

    setState(prev => ({ ...prev, isCheckingExisting: true }));

    // Always create or use the existing client
    const client = await initializeBeamsClient();
    if (!client) {
      setState(prev => ({ ...prev, isCheckingExisting: false }));
      return;
    }

    try {
      // Check if device already has a user ID set
      const existingUserId = await client.getUserId();
      notificationLogger.debug('Checking existing user ID', { existingUserId });

      if (existingUserId === user.id) {
        // Device is already registered to this user
        setState(prev => ({
          ...prev,
          isRegistered: true,
          isSubscribed: true,
          isCheckingExisting: false,
          hasOtherUserSubscription: false,
          otherUserId: undefined,
          error: undefined,
        }));
        notificationLogger.info('✅ Existing subscription found for user', {
          userId: user.id,
        });
      } else if (existingUserId) {
        // Device is registered to a different user - don't clear, just warn
        notificationLogger.warn('Device registered to different user', {
          existingUserId,
          currentUserId: user.id,
        });
        setState(prev => ({
          ...prev,
          isCheckingExisting: false,
          hasOtherUserSubscription: true,
          otherUserId: existingUserId,
          isRegistered: false,
          isSubscribed: false,
        }));
        notificationLogger.warn(
          'Warning: Device has subscription for different user'
        );
      } else {
        // No user ID set on device
        setState(prev => ({
          ...prev,
          isCheckingExisting: false,
          hasOtherUserSubscription: false,
          otherUserId: undefined,
        }));
        notificationLogger.debug('No existing subscription found');
      }
    } catch (error) {
      notificationLogger.error('Failed to check existing subscription', {
        error,
      });
      setState(prev => ({ ...prev, isCheckingExisting: false }));
    }
  }, [state.isSupported, initializeBeamsClient, user?.id]);

  const subscribe = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setState(prev => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    notificationLogger.info('Starting Pusher Beams for user', {
      userId: user.id,
    });

    const client = await initializeBeamsClient();
    if (!client) {
      return;
    }

    try {
      // Check if there's an existing user subscription that needs to be overridden
      const existingUserId = await client.getUserId();
      if (existingUserId && existingUserId !== user.id) {
        notificationLogger.warn('Overriding existing subscription', {
          existingUserId,
          newUserId: user.id,
        });
        // Clear the existing user association first
        await client.clearAllState();
      }

      notificationLogger.debug('Starting Pusher Beams client');
      await client.start();
      notificationLogger.debug('Pusher Beams client started successfully');

      notificationLogger.debug('Setting user ID for Pusher Beams', {
        userId: user.id,
      });
      await client.setUserId(user.id, {
        fetchToken: async () => {
          notificationLogger.debug('Fetching Pusher Beams auth token');
          const response = await fetch('/api/pusher/beams-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            notificationLogger.error('Failed to fetch Pusher Beams token', {
              status: response.status,
              errorText,
            });
            throw new Error(
              `Failed to fetch token (${response.status}): ${errorText}`
            );
          }

          const data = await response.json();
          notificationLogger.debug('Received Pusher Beams token data', {
            data,
          });
          return data;
        },
      });

      setState(prev => ({
        ...prev,
        isRegistered: true,
        isSubscribed: true,
        hasOtherUserSubscription: false,
        otherUserId: undefined,
        error: undefined,
      }));

      notificationLogger.info('Pusher Beams started successfully for user', {
        userId: user.id,
      });
    } catch (error) {
      notificationLogger.error('Failed to start Pusher Beams', { error });
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start push notifications',
      }));
    }
  }, [user?.id, initializeBeamsClient]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    try {
      const client = beamsClientRef.current;

      if (!client) {
        throw new Error('Pusher Beams client not initialized');
      }

      // First, get the device ID to check if we're registered
      const deviceId = await client.getDeviceId();

      if (deviceId) {
        notificationLogger.info('Clearing user association for device', {
          deviceId,
        });

        // Use clearAllState() instead of stop() for less aggressive disconnection
        await client.clearAllState();

        // Reset our state
        beamsClientRef.current = null;
        hasInitialized.current = false;

        setState(prev => ({
          ...prev,
          isRegistered: false,
          isSubscribed: false,
          hasOtherUserSubscription: false,
          otherUserId: undefined,
        }));

        notificationLogger.info(
          '✅ Successfully unsubscribed from push notifications'
        );
      } else {
        notificationLogger.debug('No device registration found to unsubscribe');
      }
    } catch (error) {
      notificationLogger.error(
        'Failed to unsubscribe from push notifications',
        { error }
      );
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error unsubscribing',
      }));
      throw error;
    }
  }, []);

  const getDeviceId = useCallback(async (): Promise<string | null> => {
    const client = beamsClientRef.current;
    if (!client) {
      return null;
    }

    try {
      return await client.getDeviceId();
    } catch (error) {
      notificationLogger.error('Failed to get device ID', { error });
      return null;
    }
  }, []);

  return {
    ...state,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    getDeviceId,
    checkExistingSubscription,
  };
}

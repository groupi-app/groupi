import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { useSession } from '@/lib/auth-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { pusherLogger } from './logger';

declare global {
  interface Window {
    PusherPushNotifications: typeof PusherPushNotifications;
  }
}

/**
 * Get the Pusher Beams instance ID.
 * Safe to call in client components - process.env.NEXT_PUBLIC_* vars are inlined at build time.
 */
function getPusherBeamsInstanceId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || '';
}

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
  const { data: session } = useSession();
  const user = session?.user;
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
          instanceId: getPusherBeamsInstanceId(),
        });

        beamsClientRef.current = client;
        return client;
      } catch (error) {
        pusherLogger.error(
          {
            error,
          },
          'Failed to initialize Pusher Beams client'
        );
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
      pusherLogger.debug({ existingUserId }, 'Checking existing user ID');

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
        pusherLogger.info(
          {
            userId: user.id,
          },
          '✅ Existing subscription found for user'
        );
      } else if (existingUserId) {
        // Device is registered to a different user - don't clear, just warn
        pusherLogger.warn(
          {
            existingUserId,
            currentUserId: user.id,
          },
          'Device registered to different user'
        );
        setState(prev => ({
          ...prev,
          isCheckingExisting: false,
          hasOtherUserSubscription: true,
          otherUserId: existingUserId,
          isRegistered: false,
          isSubscribed: false,
        }));
        pusherLogger.warn(
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
        pusherLogger.debug('No existing subscription found');
      }
    } catch (error) {
      pusherLogger.error({ error }, 'Failed to check existing subscription');
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

    pusherLogger.info(
      {
        userId: user.id,
      },
      'Starting Pusher Beams for user'
    );

    const client = await initializeBeamsClient();
    if (!client) {
      return;
    }

    try {
      // Check if there's an existing user subscription that needs to be overridden
      const existingUserId = await client.getUserId();
      if (existingUserId && existingUserId !== user.id) {
        pusherLogger.warn(
          {
            existingUserId,
            newUserId: user.id,
          },
          'Overriding existing subscription'
        );
        // Clear the existing user association first
        await client.clearAllState();
      }

      pusherLogger.debug('Starting Pusher Beams client');
      await client.start();
      pusherLogger.debug('Pusher Beams client started successfully');

      pusherLogger.debug(
        {
          userId: user.id,
        },
        'Setting user ID for Pusher Beams'
      );
      await client.setUserId(user.id, {
        fetchToken: async () => {
          pusherLogger.debug('Fetching Pusher Beams auth token');
          const response = await fetch('/api/pusher/beams-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            pusherLogger.error(
              {
                status: response.status,
                errorText,
              },
              'Failed to fetch Pusher Beams token'
            );
            throw new Error(
              `Failed to fetch token (${response.status}): ${errorText}`
            );
          }

          const data = await response.json();
          pusherLogger.debug(
            {
              data,
            },
            'Received Pusher Beams token data'
          );
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

      pusherLogger.info(
        {
          userId: user.id,
        },
        'Pusher Beams started successfully for user'
      );
    } catch (error) {
      pusherLogger.error({ error }, 'Failed to start Pusher Beams');
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
        pusherLogger.info(
          {
            deviceId,
          },
          'Clearing user association for device'
        );

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

        pusherLogger.info(
          '✅ Successfully unsubscribed from push notifications'
        );
      } else {
        pusherLogger.debug('No device registration found to unsubscribe');
      }
    } catch (error) {
      pusherLogger.error(
        {
          error,
        },
        'Failed to unsubscribe from push notifications'
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
      pusherLogger.error({ error }, 'Failed to get device ID');
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

'use client';

import { useEffect } from 'react';
import { usePusherBeams } from '@/stores/pusher-beams-store';
import { componentLogger } from '@/lib/logger';

/**
 * Global component that manages push notification subscriptions.
 *
 * This component:
 * - Checks for existing subscriptions on mount
 * - Logs subscription state changes
 * - Must be rendered within a PusherBeamsProvider
 *
 * Note: This is already wrapped by PusherBeamsProvider in the layout,
 * so it doesn't need its own provider wrapper.
 */
export function GlobalPushNotifications() {
  const {
    checkExistingSubscription,
    isSubscribed,
    isCheckingExisting,
    userId,
  } = usePusherBeams();

  useEffect(() => {
    // Actively check for existing subscriptions when component mounts
    const checkSubscription = async () => {
      componentLogger.info(
        { userId },
        'GlobalPushNotifications: Checking for existing subscriptions'
      );
      await checkExistingSubscription();
    };

    if (userId) {
      checkSubscription();
    }
  }, [checkExistingSubscription, userId]);

  useEffect(() => {
    // Log subscription state changes
    if (!isCheckingExisting) {
      if (isSubscribed) {
        componentLogger.info(
          {
            userId,
          },
          'GlobalPushNotifications: Push notifications are active'
        );
      } else {
        componentLogger.info(
          {
            userId,
          },
          'GlobalPushNotifications: No active push notifications'
        );
      }
    }
  }, [isCheckingExisting, isSubscribed, userId]);

  return null;
}

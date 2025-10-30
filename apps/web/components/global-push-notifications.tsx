'use client';

import { useEffect } from 'react';
import { usePusherBeams } from '@/components/providers/pusher-beams-context-provider';
import { componentLogger } from '@/lib/logger';

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

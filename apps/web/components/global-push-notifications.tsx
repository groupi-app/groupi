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
        'GlobalPushNotifications: Checking for existing subscriptions',
        { userId }
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
          'GlobalPushNotifications: Push notifications are active',
          {
            userId,
          }
        );
      } else {
        componentLogger.info(
          'GlobalPushNotifications: No active push notifications',
          {
            userId,
          }
        );
      }
    }
  }, [isCheckingExisting, isSubscribed, userId]);

  return null;
}

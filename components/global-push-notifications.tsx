'use client';

import { useEffect } from 'react';
import { usePusherBeams } from '@/components/providers/pusher-beams-context-provider';
import { notificationLogger } from '@/lib/logger';

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
      notificationLogger.debug(
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
        notificationLogger.info(
          'GlobalPushNotifications: Push notifications are active',
          { userId }
        );
      } else {
        notificationLogger.debug(
          'GlobalPushNotifications: No active push notifications',
          { userId }
        );
      }
    }
  }, [isCheckingExisting, isSubscribed, userId]);

  return null;
}

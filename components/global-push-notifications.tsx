'use client';

import { useEffect } from 'react';
import { usePusherBeams } from '@/components/providers/pusher-beams-context-provider';
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
      console.log(
        '🔍 GlobalPushNotifications: Checking for existing subscriptions...'
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
        console.log(
          '🔔 GlobalPushNotifications: Push notifications are active'
        );
      } else {
        console.log('ℹ️ GlobalPushNotifications: No active push notifications');
      }
    }
  }, [isCheckingExisting, isSubscribed]);

  return null;
}

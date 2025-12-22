'use client';

import { ReactNode } from 'react';
import { PusherBeamsProvider } from '@/components/providers/pusher-beams-context-provider';
import { GlobalPushNotifications } from '@/components/global-push-notifications';

export function PusherBeamsProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PusherBeamsProvider>
      {children}
      <GlobalPushNotifications />
    </PusherBeamsProvider>
  );
}

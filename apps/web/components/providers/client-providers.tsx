'use client';

import React from 'react';
import { TRPCProvider } from './trpc-provider';
import { SupabaseRealtimeProvider } from './supabase-realtime-provider';
import { PusherChannelsProvider } from './pusher-channels-provider';
import { NotificationCloseContextProvider } from './notif-close-provider';
import { ThemeProvider } from './theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PusherBeamsProvider } from './pusher-beams-context-provider';
import { GlobalPushNotifications } from '@/components/global-push-notifications';

interface ClientProvidersProps {
  children: React.ReactNode;
  userId: string | null;
}

export function ClientProviders({ children, userId }: ClientProvidersProps) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <TooltipProvider>
        <PusherBeamsProvider>
          <TRPCProvider>
            <PusherChannelsProvider>
              <SupabaseRealtimeProvider userId={userId}>
                <NotificationCloseContextProvider>
                  {children}
                </NotificationCloseContextProvider>
                <GlobalPushNotifications />
              </SupabaseRealtimeProvider>
            </PusherChannelsProvider>
          </TRPCProvider>
        </PusherBeamsProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

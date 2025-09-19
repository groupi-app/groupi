import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { NotificationType } from '@prisma/client';
import { api } from '../clients/trpc-client';
// WebSocketProvider removed; Supabase Realtime handles invalidation
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';

// Types for notification data
interface NotificationData {
  id: string;
  read: boolean;
  personId: string;
  type: NotificationType;
  // Add other notification properties as needed
}

// ============================================================================
// NOTIFICATION QUERY HOOKS
// ============================================================================

/**
 * Enhanced notifications hook with built-in real-time sync
 * Returns both data and real-time connection status
 */
export function useNotifications(userId: string) {
  const queryClient = useQueryClient();
  const query = api.notification.getForUser.useQuery(
    { id: userId },
    {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    }
  );

  // Pusher-based invalidation retired; Supabase Realtime handles updates

  // Supabase realtime patching for user's notifications
  useSupabaseRealtime(
    {
      channel: `notifications-${userId}`,
      changes: [
        {
          table: 'Notification',
          filter: `personId=eq.${userId}`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            const newRow = (
              payload as RealtimePostgresChangesPayload<NotificationData>
            ).new as unknown as NotificationData | null;
            const oldRow = (
              payload as RealtimePostgresChangesPayload<NotificationData>
            ).old as unknown as NotificationData | null;
            queryClient.setQueriesData(
              { predicate: q => q.queryKey[0] === 'notification' },
              (old: [any, NotificationData[]] | undefined) => {
                if (!old) return old;
                const [error, notifications] = old;
                if (error || !notifications) return old;
                switch (
                  (payload as RealtimePostgresChangesPayload<NotificationData>)
                    .eventType
                ) {
                  case 'INSERT':
                    return [
                      null,
                      newRow ? [newRow, ...notifications] : notifications,
                    ];
                  case 'UPDATE':
                    return [
                      null,
                      notifications.map(n =>
                        newRow && n.id === newRow.id ? { ...n, ...newRow } : n
                      ),
                    ];
                  case 'DELETE':
                    return [
                      null,
                      notifications.filter(n =>
                        oldRow ? n.id !== oldRow.id : true
                      ),
                    ];
                  default:
                    return old;
                }
              }
            );
          },
        },
      ],
    },
    [userId]
  );

  return {
    // Data from the query
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Real-time connection status
    realTime: { isConnected: true, isEnabled: true },
  };
}

/**
 * Enhanced unread notification count hook
 * Automatically updates via real-time sync when notifications change
 */
export function useUnreadNotificationCount(userId: string) {
  const { data, realTime } = useNotifications(userId);

  if (!data) {
    return {
      unreadCount: 0,
      hasUnread: false,
      totalNotifications: 0,
      realTime,
    };
  }

  const [error, notifications] = data;

  if (error || !notifications) {
    return {
      unreadCount: 0,
      hasUnread: false,
      totalNotifications: 0,
      realTime,
    };
  }

  const validNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = validNotifications.filter(
    (notification: any) => !notification.read
  ).length;

  return {
    // Unread count data
    unreadCount,
    hasUnread: unreadCount > 0,
    totalNotifications: validNotifications.length,

    // Real-time status
    realTime,
  };
}

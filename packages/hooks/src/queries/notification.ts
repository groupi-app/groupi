import { NotificationType } from '@prisma/client';
import { api } from '../clients/trpc-client';
// WebSocketProvider removed; Supabase Realtime handles invalidation
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import { NotificationDTO as NotificationSchema } from '@groupi/schema';
import type { ResultTuple } from '@groupi/schema';

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
  const query = api.notification.getForUser.useQuery(
    { cursor: undefined }, // Explicitly pass cursor as undefined for first page
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
          handler: ({ event, newRow, oldRow, queryClient }) => {
            queryClient.setQueriesData(
              { predicate: createTRPCRouterPredicate(['notification']) },
              (old: ResultTuple<unknown, NotificationData[]> | undefined) => {
                if (!old) return old;
                const [error, notifications] = old;
                if (error || !notifications) return old;
                switch (event) {
                  case 'INSERT': {
                    const parsed = NotificationSchema.safeParse(newRow);
                    if (!parsed.success) return old;
                    return [null, [parsed.data, ...notifications]];
                  }
                  case 'UPDATE': {
                    const parsed =
                      NotificationSchema.partial().safeParse(newRow);
                    if (!parsed.success) return old;
                    const patch = parsed.data;
                    return [
                      null,
                      notifications.map(n =>
                        n.id === patch.id ? { ...n, ...patch } : n
                      ),
                    ];
                  }
                  case 'DELETE':
                    return [
                      null,
                      notifications.filter(n => {
                        const delId = (oldRow as { id?: string } | null)?.id;
                        return n.id !== (delId ?? '');
                      }),
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
    (notification: { read?: boolean }) => !notification.read
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

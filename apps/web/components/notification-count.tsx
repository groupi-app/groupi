'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotificationCount } from '@/lib/queries/notification-queries';
import { qk } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useSession } from '@/lib/auth-client';
import { useEffect } from 'react';
import type { NotificationFeedData } from '@groupi/schema/data';

// Shared processed notification IDs across all NotificationCount instances
// Keyed by userId to prevent cross-user contamination
const processedNotificationIdsByUser = new Map<string, Set<string>>();

/**
 * NotificationCount component
 * Displays a badge with the unread notification count
 * Hides when count is 0
 * Updates in real-time via Pusher
 */
export function NotificationCount() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  // Get or create processed IDs set for this user
  const getProcessedIds = () => {
    if (!userId) return new Set<string>();
    if (!processedNotificationIdsByUser.has(userId)) {
      processedNotificationIdsByUser.set(userId, new Set<string>());
    }
    return processedNotificationIdsByUser.get(userId)!;
  };

  // Reset processed IDs when userId changes
  useEffect(() => {
    if (userId) {
      processedNotificationIdsByUser.set(userId, new Set<string>());
    }
  }, [userId]);

  const { data: countData } = useQuery({
    queryKey: qk.notifications.count(userId || 'anonymous'),
    queryFn: fetchNotificationCount,
    staleTime: 30 * 1000, // Consider fresh for 30s
    enabled: !!userId,
  });

  // Real-time updates via Pusher
  usePusherRealtime({
    channel: userId ? `user-${userId}-notifications` : 'dummy',
    event: 'notification-changed',
    tags: userId ? [`user-${userId}-notifications-count`] : [],
    queryKey: qk.notifications.count(userId || 'anonymous'),
    onInsert: data => {
      const notification = data as NotificationFeedData;

      if (!userId) return;

      const processedIds = getProcessedIds();

      // Skip if we've already processed this notification (shared across all instances)
      if (processedIds.has(notification.id)) {
        return;
      }

      // Mark this notification as processed (shared across all instances)
      processedIds.add(notification.id);

      // Directly increment count when a new notification is inserted
      // New notifications are always unread, so increment by 1
      queryClient.setQueryData<{ count: number }>(
        qk.notifications.count(userId),
        old => {
          if (!old) {
            // If no existing data, invalidate to fetch from server
            queryClient.invalidateQueries({
              queryKey: qk.notifications.count(userId),
            });
            return old;
          }
          return { count: old.count + 1 };
        }
      );
    },
    onUpdate: data => {
      const updateData = data as { allRead?: boolean; id?: string };

      // Handle "mark all as read" case - set count to 0 immediately
      if (updateData.allRead === true) {
        queryClient.setQueryData<{ count: number }>(
          qk.notifications.count(userId || 'anonymous'),
          () => ({ count: 0 })
        );
        return;
      }

      // For individual notification updates (mark as read/unread),
      // we don't know the read status from the Pusher event, so invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: qk.notifications.count(userId || 'anonymous'),
      });
    },
    onDelete: () => {
      // For deletes, we don't know if the deleted notification was read or unread
      // Invalidate to refetch the accurate count
      queryClient.invalidateQueries({
        queryKey: qk.notifications.count(userId || 'anonymous'),
      });
    },
  });

  const count = countData?.count ?? 0;

  if (count === 0) {
    return null;
  }

  return (
    <Badge
      variant='destructive'
      className='absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs'
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

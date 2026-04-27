import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export function useNotifications(limit = 50) {
  const { isAuthenticated } = useGlobalUser();

  const data = useQuery(
    api.notifications.queries.fetchNotificationsForPerson,
    isAuthenticated ? { limit } : 'skip'
  );

  return {
    notifications: data?.notifications ?? [],
    nextCursor: data?.nextCursor,
    isLoading: data === undefined,
  };
}

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useGlobalUser();

  return useQuery(
    api.notifications.queries.getUnreadNotificationCount,
    isAuthenticated ? {} : 'skip'
  );
}

export function useMarkNotificationAsRead() {
  const mutation = useMutation(
    api.notifications.mutations.markNotificationAsRead
  );

  return useCallback(
    async (notificationId: string) => {
      try {
        await mutation({ notificationId });
      } catch {
        // Silent — marking as read is not critical
      }
    },
    [mutation]
  );
}

export function useMarkNotificationAsUnread() {
  const mutation = useMutation(
    api.notifications.mutations.markNotificationAsUnread
  );

  return useCallback(
    async (notificationId: string) => {
      try {
        await mutation({ notificationId });
      } catch {
        toast.error('Failed to mark as unread');
      }
    },
    [mutation]
  );
}

export function useMarkAllNotificationsAsRead() {
  const mutation = useMutation(
    api.notifications.mutations.markAllNotificationsAsRead
  );

  return useCallback(async () => {
    try {
      await mutation({});
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }, [mutation]);
}

export function useDeleteNotification() {
  const mutation = useMutation(api.notifications.mutations.deleteNotification);

  return useCallback(
    async (notificationId: string) => {
      try {
        await mutation({ notificationId });
      } catch {
        toast.error('Failed to delete notification');
      }
    },
    [mutation]
  );
}

export function useDeleteAllNotifications() {
  const mutation = useMutation(
    api.notifications.mutations.deleteAllNotifications
  );

  return useCallback(async () => {
    try {
      await mutation({});
      toast.success('All notifications deleted');
    } catch {
      toast.error('Failed to delete notifications');
    }
  }, [mutation]);
}

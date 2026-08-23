import { useCallback, useMemo, useState } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  type RequestForQueries,
} from 'convex/react';
import type { FunctionReturnType } from 'convex/server';

import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

type NotificationPage = FunctionReturnType<
  typeof api.notifications.queries.fetchNotificationsForPerson
>;

export type NotificationItem = NotificationPage['notifications'][number];

export function useNotifications(limit = 20) {
  const { isAuthenticated } = useGlobalUser();
  const [cursors, setCursors] = useState<Array<string | undefined>>([
    undefined,
  ]);

  const requests = useMemo(() => {
    if (!isAuthenticated) return {};

    const pageRequests: RequestForQueries = {};
    cursors.forEach((cursor, index) => {
      pageRequests[`page-${index}`] = {
        query: api.notifications.queries.fetchNotificationsForPerson,
        args: cursor ? { limit, cursor } : { limit },
      };
    });
    return pageRequests;
  }, [cursors, isAuthenticated, limit]);

  const results = useQueries(requests);
  const pages = cursors.map((_, index) => {
    const result = results[`page-${index}`];
    return result instanceof Error
      ? result
      : (result as NotificationPage | undefined);
  });
  const lastPage = pages.at(-1);
  const pageError = pages.find(page => page instanceof Error);

  const notifications = useMemo(() => {
    const uniqueNotifications = new Map<
      Id<'notifications'>,
      NotificationItem
    >();
    for (const page of pages) {
      if (!page || page instanceof Error) continue;
      for (const notification of page.notifications) {
        uniqueNotifications.set(notification._id, notification);
      }
    }
    return [...uniqueNotifications.values()];
  }, [pages]);

  const loadMore = useCallback(() => {
    if (!lastPage || lastPage instanceof Error || !lastPage.nextCursor) return;
    const nextCursor = lastPage.nextCursor;
    setCursors(current =>
      current.includes(nextCursor) ? current : [...current, nextCursor]
    );
  }, [lastPage]);

  return {
    notifications,
    isLoading: isAuthenticated && pages[0] === undefined,
    isLoadingMore: cursors.length > 1 && lastPage === undefined,
    hasMore:
      lastPage !== undefined &&
      !(lastPage instanceof Error) &&
      lastPage.nextCursor !== null,
    loadMore,
    error: pageError instanceof Error ? pageError : null,
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
    async (notificationId: Id<'notifications'>) => {
      try {
        await mutation({ notificationId });
      } catch {
        toast.error('Failed to mark notification as read');
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
    async (notificationId: Id<'notifications'>) => {
      try {
        await mutation({ notificationId });
      } catch {
        toast.error('Failed to mark notification as unread');
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
      const result = await mutation({});
      toast.success(
        result.count === 1
          ? 'Marked 1 notification as read'
          : `Marked ${result.count} notifications as read`
      );
    } catch {
      toast.error('Failed to mark all as read');
    }
  }, [mutation]);
}

export function useDeleteNotification() {
  const mutation = useMutation(api.notifications.mutations.deleteNotification);

  return useCallback(
    async (notificationId: Id<'notifications'>) => {
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

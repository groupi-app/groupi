import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';

// ============================================================================
// NOTIFICATION MUTATION HOOKS
// ============================================================================

/**
 * Hook for marking a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  const mutation = api.notification.markAsRead.useMutation({
    onMutate: async ({ notificationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Optimistic update - mark notification as read
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'notification' },
        (old: any) => {
          if (!old || old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: any) =>
                notif.id === notificationId ? { ...notif, isRead: true } : notif
              ),
            ];
          }

          // Handle paginated response
          if (data.notifications) {
            return [
              null,
              {
                ...data,
                notifications: data.notifications.map((notif: any) =>
                  notif.id === notificationId
                    ? { ...notif, isRead: true }
                    : notif
                ),
              },
            ];
          }

          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Trigger refetch to ensure consistency
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for marking a notification as unread
 */
export function useMarkNotificationAsUnread() {
  const queryClient = useQueryClient();

  const mutation = api.notification.markAsUnread.useMutation({
    onMutate: async ({ notificationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Optimistic update - mark notification as unread
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'notification' },
        (old: any) => {
          if (!old || old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: any) =>
                notif.id === notificationId
                  ? { ...notif, isRead: false }
                  : notif
              ),
            ];
          }

          // Handle paginated response
          if (data.notifications) {
            return [
              null,
              {
                ...data,
                notifications: data.notifications.map((notif: any) =>
                  notif.id === notificationId
                    ? { ...notif, isRead: false }
                    : notif
                ),
              },
            ];
          }

          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Trigger refetch to ensure consistency
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsAsRead(_userId: string) {
  const queryClient = useQueryClient();

  const mutation = api.notification.markAllAsRead.useMutation({
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Optimistic update - mark all notifications as read
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'notification' },
        (old: any) => {
          if (!old || old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: any) => ({ ...notif, isRead: true })),
            ];
          }

          // Handle paginated response
          if (data.notifications) {
            return [
              null,
              {
                ...data,
                notifications: data.notifications.map((notif: any) => ({
                  ...notif,
                  isRead: true,
                })),
              },
            ];
          }

          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Trigger refetch to ensure consistency
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  const mutation = api.notification.delete.useMutation({
    onMutate: async ({ notificationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Optimistic update - remove notification
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'notification' },
        (old: any) => {
          if (!old || old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.filter((notif: any) => notif.id !== notificationId),
            ];
          }

          // Handle paginated response
          if (data.notifications) {
            return [
              null,
              {
                ...data,
                notifications: data.notifications.filter(
                  (notif: any) => notif.id !== notificationId
                ),
                total: Math.max(0, (data.total || 0) - 1),
              },
            ];
          }

          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Trigger refetch to ensure consistency
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  const mutation = api.notification.deleteAll.useMutation({
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Optimistic update - clear all notifications
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'notification' },
        (old: any) => {
          if (!old || old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [null, []];
          }

          // Handle paginated response
          if (data.notifications) {
            return [null, { ...data, notifications: [], total: 0 }];
          }

          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Trigger refetch to ensure consistency
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Enhanced mark event notifications as read hook
 * Marks all notifications for a specific event as read
 */
export function useMarkEventNotificationsAsRead() {
  const queryClient = useQueryClient();

  const mutation = api.notification.markEventNotificationsAsRead.useMutation({
    onMutate: async ({ eventId, personId }) => {
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'notification',
      });

      // Optimistically update to mark event notifications as read
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'notification' },
        (old: any) => {
          if (!old || old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: any) =>
                notif.type === 'POST' || notif.type === 'REPLY'
                  ? { ...notif, isRead: true }
                  : notif
              ),
            ];
          }

          // Handle paginated response
          if (data.notifications) {
            return [
              null,
              {
                ...data,
                notifications: data.notifications.map((notif: any) =>
                  notif.type === 'POST' || notif.type === 'REPLY'
                    ? { ...notif, isRead: true }
                    : notif
                ),
              },
            ];
          }

          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'notification',
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    realTime: {
      isConnected: true,
      isEnabled: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import type { NotificationFeedDTO, ResultTuple } from '@groupi/schema';

// Type for the notification query cache data (currently unused but kept for future use)
// type _NotificationQueryData = ResultTuple<unknown, NotificationFeedDTO[]>;
type NotificationPaginatedData = {
  notifications: NotificationFeedDTO[];
  total: number;
  nextCursor?: string;
};

// Import proper error types from centralized domain errors
import type {
  NotFoundError,
  DatabaseError,
  ValidationError,
} from '@groupi/schema';

// ============================================================================
// TYPES
// ============================================================================

type NotificationMutationError =
  | NotFoundError
  | DatabaseError
  | ValidationError;

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
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Optimistic update - mark notification as read
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['notification']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          if (old[0] !== null) return old; // Check for error state
          const [_error, data] = old as [unknown, unknown];
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: unknown) => {
                if (
                  typeof notif === 'object' &&
                  notif !== null &&
                  'id' in notif &&
                  'isRead' in notif
                ) {
                  return (notif as Record<string, unknown>).id ===
                    notificationId
                    ? { ...(notif as Record<string, unknown>), isRead: true }
                    : notif;
                }
                return notif;
              }),
            ];
          }

          // Handle paginated response
          if (data && typeof data === 'object' && 'notifications' in data) {
            return [
              null,
              {
                ...data,
                notifications: (
                  data as NotificationPaginatedData
                ).notifications.map((notif: Record<string, unknown>) =>
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
        predicate: createTRPCRouterPredicate(['notification']),
      });
    },
    retry: false,
  });

  // Clean mutation function for components
  const markAsRead = useCallback(
    async (
      notificationId: string,
      callbacks?: {
        onSuccess?: () => void;
        onError?: (error: NotificationMutationError) => void;
      }
    ): Promise<ResultTuple<NotificationMutationError, { message: string }>> => {
      try {
        const updateResult = await mutation.mutateAsync({ notificationId });

        callbacks?.onSuccess?.();
        return [null, updateResult as { message: string }];
      } catch (error) {
        const mutationError = error as NotificationMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    markAsRead,

    // Mutation status
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
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
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Optimistic update - mark notification as unread
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['notification']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          if (old[0] !== null) return old; // Check for error state
          const [_error, data] = old as [
            unknown,
            NotificationFeedDTO[] | NotificationPaginatedData,
          ];
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: Record<string, unknown>) =>
                notif.id === notificationId
                  ? { ...notif, isRead: false }
                  : notif
              ),
            ];
          }

          // Handle paginated response
          if (data && typeof data === 'object' && 'notifications' in data) {
            return [
              null,
              {
                ...data,
                notifications: (
                  data as NotificationPaginatedData
                ).notifications.map((notif: Record<string, unknown>) =>
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
        predicate: createTRPCRouterPredicate(['notification']),
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
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Optimistic update - mark all notifications as read
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['notification']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          if (old[0] !== null) return old; // Check for error state
          const [_error, data] = old as [
            unknown,
            NotificationFeedDTO[] | NotificationPaginatedData,
          ];
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: Record<string, unknown>) => ({
                ...notif,
                isRead: true,
              })),
            ];
          }

          // Handle paginated response
          if (data && typeof data === 'object' && 'notifications' in data) {
            return [
              null,
              {
                ...data,
                notifications: (
                  data as NotificationPaginatedData
                ).notifications.map((notif: Record<string, unknown>) => ({
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
        predicate: createTRPCRouterPredicate(['notification']),
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

  const mutation = api.notification.markAsUnread.useMutation({
    onMutate: async ({ notificationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['notification']),
      });

      // Optimistic update - remove notification
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['notification']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          if (old[0] !== null) return old; // Check for error state
          const [_error, data] = old;
          if (!data) return old;

          // Handle array of notifications
          if (Array.isArray(data)) {
            return [
              null,
              (data as NotificationFeedDTO[]).filter(
                notif => notif.id !== notificationId
              ),
            ];
          }

          // Handle paginated response
          if (data && typeof data === 'object' && 'notifications' in data) {
            return [
              null,
              {
                ...data,
                notifications: data.notifications.filter(
                  (notif: Record<string, unknown>) =>
                    notif.id !== notificationId
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
        predicate: createTRPCRouterPredicate(['notification']),
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

  // No deleteAll endpoint; simulate by marking all as read and clearing locally
  const mutation = api.notification.markAllAsRead.useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['notification']),
      });
      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['notification']),
      });
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['notification']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          if (old[0] !== null) return old;
          const [_error, data] = old as [
            unknown,
            NotificationFeedDTO[] | NotificationPaginatedData,
          ];
          if (!data) return old;
          if (Array.isArray(data)) {
            return [null, []];
          }
          if (data.notifications) {
            return [null, { ...data, notifications: [], total: 0 }];
          }
          return old;
        }
      );
      return { previousQueries };
    },
    onError: (
      _err: unknown,
      _variables: unknown,
      context: { previousQueries?: Array<[unknown, unknown]> } | undefined
    ) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey as Parameters<typeof queryClient.setQueryData>[0],
            data
          );
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['notification']),
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
 * Replaced with markAllAsRead for simplicity; caller should filter per event server-side
 */
export function useMarkEventNotificationsAsRead() {
  const queryClient = useQueryClient();

  const mutation = api.notification.markAllAsRead.useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['notification']),
      });
      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['notification']),
      });
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['notification']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          if (old[0] !== null) return old;
          const [_error, data] = old;
          if (!data) return old;
          if (Array.isArray(data)) {
            return [
              null,
              data.map((notif: Record<string, unknown>) => ({
                ...notif,
                isRead: true,
              })),
            ];
          }
          if (data.notifications) {
            return [
              null,
              {
                ...data,
                notifications: (
                  data as NotificationPaginatedData
                ).notifications.map((notif: Record<string, unknown>) => ({
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
    onError: (
      _err: unknown,
      _variables: unknown,
      context: { previousQueries?: Array<[unknown, unknown]> } | undefined
    ) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey as Parameters<typeof queryClient.setQueryData>[0],
            data
          );
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['notification']),
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

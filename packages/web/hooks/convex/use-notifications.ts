'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useIsActive } from '@/providers/visibility-provider';

// ===== API REFERENCES =====
// Import api dynamically to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let notificationQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let notificationMutations: any;

// Initialize lazily to avoid module-level type evaluation
function initApi() {
  if (!notificationQueries) {
    // Dynamic require avoids type inference at module load time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    notificationQueries = api.notifications?.queries ?? {};
    notificationMutations = api.notifications?.mutations ?? {};
  }
}

// Ensure API is initialized before hooks are called
initApi();

// ===== TYPES =====

export interface EnrichedNotification {
  id: Id<'notifications'>;
  _id: Id<'notifications'>;
  _creationTime: number;
  createdAt: number;
  type: string;
  read: boolean;
  eventId: Id<'events'> | null;
  postId: Id<'posts'> | null;
  personId: Id<'persons'>;
  event: { id: Id<'events'>; title: string } | null;
  post: { id: Id<'posts'>; title: string } | null;
  author: {
    id: Id<'persons'>;
    user: {
      name: string | null;
      email: string;
      image: string | null;
      username: string | null;
    };
  } | null;
  recipientId: Id<'persons'>;
  rsvpStatus?: string;
  rsvpNewStatus?: string;
}

// ===== NOTIFICATION QUERIES =====

/**
 * Get paginated notifications for current user with real-time updates.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function useNotifications(
  limit = 20,
  cursor?: string
):
  | {
      notifications: EnrichedNotification[];
      nextCursor: string | null;
    }
  | undefined {
  const isActive = useIsActive();
  const cachedRef = useRef<
    | {
        notifications: EnrichedNotification[];
        nextCursor: string | null;
      }
    | undefined
  >(undefined);

  const result = useQuery(
    notificationQueries.fetchNotificationsForPerson,
    isActive ? { limit, cursor } : 'skip'
  );

  // Cache the result when we get data
  if (result !== undefined) {
    // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
    cachedRef.current = result;
  }

  // Return cached data when hidden
  // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
  return isActive ? result : cachedRef.current;
}

/**
 * Get unread notification count with real-time updates.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function useUnreadNotificationCount(): { count: number } | undefined {
  const isActive = useIsActive();
  const cachedRef = useRef<{ count: number } | undefined>(undefined);

  const result = useQuery(
    notificationQueries.getUnreadNotificationCount,
    isActive ? {} : 'skip'
  );

  if (result !== undefined) {
    // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
    cachedRef.current = result;
  }

  // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
  return isActive ? result : cachedRef.current;
}

/**
 * Get notification settings for current user
 */
export function useNotificationSettings() {
  return useQuery(notificationQueries.fetchUserNotificationSettings, {});
}

/**
 * Paginated notifications hook - uses custom cursor-based pagination.
 * Note: Use cursor from result.nextCursor for subsequent pages.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function usePaginatedNotifications(
  limit = 20,
  cursor?: string
):
  | {
      notifications: EnrichedNotification[];
      nextCursor: string | null;
    }
  | undefined {
  const isActive = useIsActive();
  const cachedRef = useRef<
    | {
        notifications: EnrichedNotification[];
        nextCursor: string | null;
      }
    | undefined
  >(undefined);

  const result = useQuery(
    notificationQueries.fetchNotificationsForPerson,
    isActive ? { limit, cursor } : 'skip'
  );

  if (result !== undefined) {
    // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
    cachedRef.current = result;
  }

  // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
  return isActive ? result : cachedRef.current;
}

// ===== NOTIFICATION MUTATIONS =====

/**
 * Mark single notification as read
 */
export function useMarkNotificationAsRead(): (
  notificationId: Id<'notifications'>
) => Promise<void> {
  const markAsReadMutation = useMutation(
    notificationMutations.markNotificationAsRead
  );
  const { toast } = useToast();

  return useCallback(
    async (notificationId: Id<'notifications'>) => {
      try {
        await markAsReadMutation({ notificationId });
        // Success toast not needed - this is a quiet action
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to mark notification as read.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [markAsReadMutation, toast]
  );
}

/**
 * Mark single notification as unread
 */
export function useMarkNotificationAsUnread(): (
  notificationId: Id<'notifications'>
) => Promise<void> {
  const markAsUnread = useMutation(
    notificationMutations.markNotificationAsUnread
  );
  const { toast } = useToast();

  return useCallback(
    async (notificationId: Id<'notifications'>) => {
      try {
        await markAsUnread({ notificationId });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to mark notification as unread.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [markAsUnread, toast]
  );
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const markAllAsRead = useMutation(
    notificationMutations.markAllNotificationsAsRead
  );
  const { toast } = useToast();

  return useCallback(async () => {
    try {
      const result = await markAllAsRead({});
      toast({
        title: 'Success',
        description: `Marked ${result.count} notifications as read.`,
      });
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [markAllAsRead, toast]);
}

/**
 * Mark event notifications as read
 */
export function useMarkEventNotificationsAsRead() {
  const markEventAsRead = useMutation(
    notificationMutations.markEventNotificationsAsRead
  );

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        await markEventAsRead({ eventId });
        // Quiet action - no success toast needed
      } catch (error) {
        console.error('Failed to mark event notifications as read:', error);
      }
    },
    [markEventAsRead]
  );
}

/**
 * Delete single notification
 */
export function useDeleteNotification() {
  const deleteNotification = useMutation(
    notificationMutations.deleteNotification
  );
  const { toast } = useToast();

  return useCallback(
    async (notificationId: Id<'notifications'>) => {
      try {
        await deleteNotification({ notificationId });
        toast({
          title: 'Success',
          description: 'Notification deleted.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete notification.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [deleteNotification, toast]
  );
}

/**
 * Delete all notifications
 */
export function useDeleteAllNotifications() {
  const deleteAllNotifications = useMutation(
    notificationMutations.deleteAllNotifications
  );
  const { toast } = useToast();

  return useCallback(async () => {
    try {
      const result = await deleteAllNotifications({});
      toast({
        title: 'Success',
        description: `Deleted ${result.count} notifications.`,
      });
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notifications.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [deleteAllNotifications, toast]);
}

// ===== NOTIFICATION SETTINGS =====
// Notification settings are now managed in use-settings.ts
// See: useSaveNotificationSettings, useDeleteNotificationMethod, useNotificationMethodSettings

// ===== COMBINED HOOKS =====

/**
 * Complete notifications management hook
 */
export function useNotificationManagement() {
  const notifications = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const settings = useNotificationSettings();

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();

  return {
    // Data
    notifications: (notifications?.notifications ??
      []) as EnrichedNotification[],
    unreadCount: unreadCount?.count || 0,
    settings,

    // Loading states
    isLoading: notifications === undefined,
    isUnreadCountLoading: unreadCount === undefined,
    isSettingsLoading: settings === undefined,

    // Pagination
    hasMore: notifications?.nextCursor !== null,
    nextCursor: notifications?.nextCursor,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}

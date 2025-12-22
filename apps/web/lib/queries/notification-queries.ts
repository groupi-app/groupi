import {
  fetchNotificationsAction,
  fetchNotificationCountAction,
} from '@/actions/query-actions';
import type {
  NotificationFeedData,
  NotificationCountData,
} from '@groupi/schema/data';

/**
 * Query adapter functions for notifications
 * Convert result tuples [error, data] to React Query format (throw on error)
 * These call server actions which safely wrap cache functions
 */

/**
 * Fetches notifications for current user
 * Adapter: Converts result tuple to React Query format
 * @param cursor - Optional cursor for pagination
 * @returns NotificationFeedData[] or throws error
 */
export async function fetchNotifications(
  cursor?: string
): Promise<NotificationFeedData[]> {
  const [error, data] = await fetchNotificationsAction(cursor);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}

/**
 * Fetches unread notification count for current user
 * Adapter: Converts result tuple to React Query format
 * @returns NotificationCountData or throws error
 */
export async function fetchNotificationCount(): Promise<NotificationCountData> {
  const [error, data] = await fetchNotificationCountAction();

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}

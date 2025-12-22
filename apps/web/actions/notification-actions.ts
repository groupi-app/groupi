'use server';

import { updateTag } from 'next/cache';
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  markPostNotificationsAsRead,
  markEventNotificationsAsRead,
  markNotificationAsReadByPostAndType,
} from '@groupi/services';
import { getUserId } from '@groupi/services/server';
import { pusherServer } from '@/lib/pusher-server';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import type { NotificationType } from '@prisma/client';
// Error types removed - not currently used

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

// NotificationMutationError type removed - not currently used

interface MarkAsReadInput {
  notificationId: string;
}

interface MarkAsUnreadInput {
  notificationId: string;
}

interface DeleteNotificationInput {
  notificationId: string;
}

interface MarkPostNotificationsAsReadInput {
  postId: string;
}

interface MarkEventNotificationsAsReadInput {
  eventId: string;
}

interface MarkNotificationAsReadByPostAndTypeInput {
  postId: string;
  type: NotificationType;
}

/**
 * Mark notification as read
 * Returns: [error, { message }] tuple
 */
export async function markNotificationAsReadAction(
  input: MarkAsReadInput
): Promise<ResultTuple<SerializedError, { message: string }>> {
  const result = await markNotificationAsRead({
    notificationId: input.notificationId,
  });

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'UPDATE',
          new: { id: input.notificationId },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Mark notification as unread
 * Returns: [error, { message }] tuple
 */
export async function markNotificationAsUnreadAction(
  input: MarkAsUnreadInput
): Promise<ResultTuple<SerializedError, { message: string }>> {
  const result = await markNotificationAsUnread({
    notificationId: input.notificationId,
  });

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'UPDATE',
          new: { id: input.notificationId },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Mark all notifications as read for current user
 * Returns: [error, { message }] tuple
 */
export async function markAllNotificationsAsReadAction(): Promise<
  ResultTuple<SerializedError, { message: string }>
> {
  const result = await markAllNotificationsAsRead({});

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications (all updated)
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'UPDATE',
          new: { allRead: true },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Delete a notification
 * Returns: [error, { message }] tuple
 */
export async function deleteNotificationAction(
  input: DeleteNotificationInput
): Promise<ResultTuple<SerializedError, { message: string }>> {
  const result = await deleteNotification({
    notificationId: input.notificationId,
  });

  // Invalidate notification cache on successful delete
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'DELETE',
          old: { id: input.notificationId },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Delete all notifications for current user
 * Returns: [error, { message }] tuple
 */
export async function deleteAllNotificationsAction(): Promise<
  ResultTuple<SerializedError, { message: string }>
> {
  const result = await deleteAllNotifications({});

  // Invalidate notification cache on successful delete
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications (all deleted)
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'DELETE',
          old: { allDeleted: true },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Mark post-related notifications as read for a specific post
 * Marks: USER_MENTIONED, NEW_REPLY, NEW_POST
 * Returns: [error, { message, count }] tuple
 */
export async function markPostNotificationsAsReadAction(
  input: MarkPostNotificationsAsReadInput
): Promise<ResultTuple<SerializedError, { message: string; count: number }>> {
  const result = await markPostNotificationsAsRead({
    postId: input.postId,
  });

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'UPDATE',
          new: { postId: input.postId, count: result[1]?.count },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Mark event-related notifications as read for a specific event
 * Marks all event-related types by default
 * Returns: [error, { message, count }] tuple
 */
export async function markEventNotificationsAsReadAction(
  input: MarkEventNotificationsAsReadInput
): Promise<ResultTuple<SerializedError, { message: string; count: number }>> {
  const result = await markEventNotificationsAsRead({
    eventId: input.eventId,
  });

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);

      // Trigger Pusher event for user notifications
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'UPDATE',
          new: { eventId: input.eventId, count: result[1]?.count },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

/**
 * Mark a specific notification type as read for a post
 * Used for real-time updates (lightweight, doesn't invalidate cache)
 * Returns: [error, { message, count }] tuple
 */
export async function markNotificationAsReadByPostAndTypeAction(
  input: MarkNotificationAsReadByPostAndTypeInput
): Promise<ResultTuple<SerializedError, { message: string; count: number }>> {
  const result = await markNotificationAsReadByPostAndType({
    postId: input.postId,
    type: input.type,
  });

  // Don't invalidate cache for real-time updates - rely on Pusher event
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      // Trigger Pusher event for real-time UI updates
      await pusherServer
        .trigger(`user-${userId}-notifications`, 'notification-changed', {
          type: 'UPDATE',
          new: { postId: input.postId, notificationType: input.type },
        })
        .catch((err: unknown) => {
          console.error(
            '[Pusher] Failed to trigger notification-changed:',
            err
          );
        });
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeResultTuple(result);
}

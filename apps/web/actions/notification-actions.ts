'use server';

import { updateTag } from 'next/cache';
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  getUserId,
} from '@groupi/services';
import type { ResultTuple } from '@groupi/schema';
import type {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  ConnectionError,
  ConstraintError,
  OperationError,
} from '@groupi/schema';

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

type NotificationMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

interface MarkAsReadInput {
  notificationId: string;
}

interface MarkAsUnreadInput {
  notificationId: string;
}

/**
 * Mark notification as read
 * Returns: [error, { message }] tuple
 */
export async function markNotificationAsReadAction(
  input: MarkAsReadInput
): Promise<ResultTuple<NotificationMutationError, { message: string }>> {
  const result = await markNotificationAsRead({
    notificationId: input.notificationId,
  });

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);
    }
  }

  return result;
}

/**
 * Mark notification as unread
 * Returns: [error, { message }] tuple
 */
export async function markNotificationAsUnreadAction(
  input: MarkAsUnreadInput
): Promise<ResultTuple<NotificationMutationError, { message: string }>> {
  const result = await markNotificationAsUnread({
    notificationId: input.notificationId,
  });

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);
    }
  }

  return result;
}

/**
 * Mark all notifications as read for current user
 * Returns: [error, { message }] tuple
 */
export async function markAllNotificationsAsReadAction(): Promise<
  ResultTuple<NotificationMutationError, { message: string }>
> {
  const result = await markAllNotificationsAsRead({});

  // Invalidate notification cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-notifications`);
    }
  }

  return result;
}

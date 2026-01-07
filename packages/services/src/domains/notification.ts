import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import { getPusherServer } from '../infrastructure';
import type { ResultTuple } from '@groupi/schema';
import { Status, NotificationType } from '@prisma/client';
import {
  GetNotificationsForPersonParams,
  MarkNotificationAsReadParams,
  MarkNotificationAsUnreadParams,
  MarkAllNotificationsAsReadParams,
  CreateEventNotificationsParams,
  GetUnreadNotificationCountParams,
  DeleteNotificationParams,
  DeleteAllNotificationsParams,
} from '@groupi/schema/params';
import {
  NotificationFeedData,
  NotificationCountData,
} from '@groupi/schema/data';
import {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
  OperationError,
  AuthenticationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { getNEXT_PUBLIC_BASE_URL } from '../infrastructure/env';

// ============================================================================
// NOTIFICATION DOMAIN SERVICES
// ============================================================================

/**
 * Helper function to trigger notification delivery processing
 * Calls the API route asynchronously (fire-and-forget)
 */
function triggerNotificationDelivery(notificationId: string): Promise<void> {
  const baseUrl = getNEXT_PUBLIC_BASE_URL();
  const apiUrl = `${baseUrl}/api/notifications/process`;

  // eslint-disable-next-line no-console
  console.log('[Notification] Triggering delivery', { notificationId, apiUrl });

  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notificationId }),
  })
    .then(response => {
      // eslint-disable-next-line no-console
      console.log('[Notification] Delivery API response', {
        notificationId,
        status: response.status,
        ok: response.ok,
      });
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error('[Notification] Delivery API error', {
        notificationId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

/**
 * Fetch notifications for a person
 */
export const fetchNotificationsForPerson = async ({
  cursor,
}: GetNotificationsForPersonParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | AuthenticationError,
    NotificationFeedData[]
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, personId] = await getUserId();
  if (authError || !personId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching notifications for person', {
      personId,
      cursor,
    });

    const notifications = yield* Effect.promise(() =>
      db.notification.findMany({
        where: { personId },
        select: {
          id: true,
          type: true,
          read: true,
          createdAt: true,
          datetime: true,
          rsvp: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchNotificationsForPerson',
          personId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Direct construction
    const result: NotificationFeedData[] = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
      datetime: notification.datetime,
      rsvp: notification.rsvp,
      event: notification.event
        ? {
            id: notification.event.id,
            title: notification.event.title,
          }
        : null,
      post: notification.post
        ? {
            id: notification.post.id,
            title: notification.post.title,
          }
        : null,
      author: notification.author
        ? {
            id: notification.author.id,
            user: {
              name: notification.author.user.name,
              email: notification.author.user.email,
              image: notification.author.user.image,
            },
          }
        : null,
    }));

    yield* Effect.logDebug('Notifications fetched successfully', {
      personId,
      notificationCount: result.length,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        // Log the actual error for debugging
        yield* Effect.logError('Failed to fetch notifications', {
          personId,
          error: err instanceof Error ? err.message : String(err),
          errorType: err instanceof Error ? err.constructor.name : typeof err,
        });

        return [
          new DatabaseError({ message: 'Failed to fetch notifications' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, NotificationFeedData[]])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async ({
  notificationId,
}: MarkNotificationAsReadParams): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | ValidationError
    | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Marking notification as read', {
      notificationId,
      userId,
    });

    // Check if notification exists and belongs to user
    const notification = yield* Effect.promise(() =>
      db.notification.findUnique({
        where: { id: notificationId },
        select: { personId: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markNotificationAsRead.fetchNotification',
          notificationId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!notification) {
      yield* Effect.fail(
        new NotFoundError({
          message: `Notification not found`,
          cause: notificationId,
        })
      );
      return;
    }

    if (notification.personId !== userId) {
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to update this notification',
        })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.notification.update({
        where: { id: notificationId },
        data: { read: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markNotificationAsRead.updateNotification',
          notificationId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result = { message: 'Notification marked as read' };

    yield* Effect.logDebug('Notification marked as read successfully', {
      userId, // Who performed the action
      notificationId,
      operation: 'update',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logDebug('Notification not found', {
            userId,
            notificationId,
            operation: 'markNotificationAsRead',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logDebug('User not authorized to update notification', {
            userId,
            notificationId,
            reason: 'not_owner',
            operation: 'markNotificationAsRead',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return NotificationUpdateError
        return [
          new DatabaseError({ message: 'Failed to mark notification as read' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Mark notification as unread
 */
export const markNotificationAsUnread = async ({
  notificationId,
}: MarkNotificationAsUnreadParams): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | ValidationError
    | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Marking notification as unread', {
      notificationId,
      userId,
    });

    // Check if notification exists and belongs to user
    const notification = yield* Effect.promise(() =>
      db.notification.findUnique({
        where: { id: notificationId },
        select: { personId: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markNotificationAsUnread.fetchNotification',
          notificationId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!notification) {
      yield* Effect.fail(
        new NotFoundError({
          message: `Notification not found`,
          cause: notificationId,
        })
      );
      return;
    }

    if (notification.personId !== userId) {
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to update this notification',
        })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.notification.update({
        where: { id: notificationId },
        data: { read: false },
      })
    ).pipe(
      Effect.mapError(cause => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markNotificationAsUnread.updateNotification',
          notificationId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result = { message: 'Notification marked as unread' };

    yield* Effect.logDebug('Notification marked as unread successfully', {
      userId, // Who performed the action
      notificationId,
      operation: 'update',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logDebug('Notification not found', {
            userId,
            notificationId,
            operation: 'markNotificationAsUnread',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logDebug('User not authorized to update notification', {
            userId,
            notificationId,
            reason: 'not_owner',
            operation: 'markNotificationAsUnread',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return NotificationUpdateError
        return [
          new DatabaseError({
            message: 'Failed to mark notification as unread',
          }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
  _params: MarkAllNotificationsAsReadParams
): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | ValidationError | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Marking all notifications as read', {
      userId,
    });

    const result = yield* Effect.promise(() =>
      db.notification.updateMany({
        where: { personId: userId, read: false },
        data: { read: true },
      })
    ).pipe(
      Effect.mapError(cause => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markAllNotificationsAsRead',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const message = `Marked ${result.count} notifications as read`;

    yield* Effect.logDebug('All notifications marked as read successfully', {
      userId, // Who performed the action
      count: result.count,
      operation: 'update',
    });

    return { message };
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.succeed([
        new DatabaseError({
          message: 'Failed to mark all notifications as read',
        }),
        undefined,
      ] as const);
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Mark post-related notifications as read for a specific post
 * Marks: USER_MENTIONED, NEW_REPLY, NEW_POST
 */
export const markPostNotificationsAsRead = async ({
  postId,
}: {
  postId: string;
}): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | ValidationError | AuthenticationError,
    { message: string; count: number }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Marking post notifications as read', {
      userId,
      postId,
    });

    const result = yield* Effect.promise(() =>
      db.notification.updateMany({
        where: {
          personId: userId,
          postId: postId,
          type: { in: ['USER_MENTIONED', 'NEW_REPLY', 'NEW_POST'] },
          read: false,
        },
        data: { read: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markPostNotificationsAsRead',
          userId,
          postId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const message = `Marked ${result.count} post notifications as read`;

    yield* Effect.logDebug('Post notifications marked as read successfully', {
      userId,
      postId,
      count: result.count,
      operation: 'update',
    });

    return { message, count: result.count };
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.succeed([
        new DatabaseError({
          message: 'Failed to mark post notifications as read',
        }),
        undefined,
      ] as const);
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, { message: string; count: number }]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Mark event-related notifications as read for a specific event
 * Default types: All event-related notification types
 */
export const markEventNotificationsAsRead = async ({
  eventId,
  types,
}: {
  eventId: string;
  types?: NotificationType[];
}): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | ValidationError | AuthenticationError,
    { message: string; count: number }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  // Default to all event-related notification types
  const notificationTypes: NotificationType[] = types || [
    'EVENT_EDITED',
    'NEW_POST',
    'DATE_CHOSEN',
    'DATE_CHANGED',
    'DATE_RESET',
    'USER_JOINED',
    'USER_LEFT',
    'USER_PROMOTED',
    'USER_DEMOTED',
    'USER_RSVP',
  ];

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Marking event notifications as read', {
      userId,
      eventId,
      types: notificationTypes,
    });

    const result = yield* Effect.promise(() =>
      db.notification.updateMany({
        where: {
          personId: userId,
          eventId: eventId,
          type: { in: notificationTypes },
          read: false,
        },
        data: { read: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markEventNotificationsAsRead',
          userId,
          eventId,
          types: notificationTypes,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const message = `Marked ${result.count} event notifications as read`;

    yield* Effect.logDebug('Event notifications marked as read successfully', {
      userId,
      eventId,
      count: result.count,
      types: notificationTypes,
      operation: 'update',
    });

    return { message, count: result.count };
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.succeed([
        new DatabaseError({
          message: 'Failed to mark event notifications as read',
        }),
        undefined,
      ] as const);
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, { message: string; count: number }]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Mark a specific notification type as read for a post
 * Used for real-time updates (e.g., mark NEW_REPLY when receiving reply-changed event)
 */
export const markNotificationAsReadByPostAndType = async ({
  postId,
  type,
}: {
  postId: string;
  type: NotificationType;
}): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | ValidationError | AuthenticationError,
    { message: string; count: number }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Marking notification as read by post and type', {
      userId,
      postId,
      type,
    });

    const result = yield* Effect.promise(() =>
      db.notification.updateMany({
        where: {
          personId: userId,
          postId: postId,
          type: type,
          read: false,
        },
        data: { read: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'markNotificationAsReadByPostAndType',
          userId,
          postId,
          type,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const message = `Marked ${result.count} notification(s) as read`;

    yield* Effect.logInfo(
      'Notification marked as read by post and type successfully',
      {
        userId,
        postId,
        type,
        count: result.count,
        operation: 'update',
      }
    );

    return { message, count: result.count };
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.succeed([
        new DatabaseError({
          message: 'Failed to mark notification as read by post and type',
        }),
        undefined,
      ] as const);
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, { message: string; count: number }]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Get unread notification count for authenticated user
 */
export const getUnreadNotificationCount = async (
  _params: GetUnreadNotificationCountParams
): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | AuthenticationError,
    NotificationCountData
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching unread notification count', {
      userId,
    });

    const count = yield* Effect.promise(() =>
      db.notification.count({
        where: {
          personId: userId,
          read: false,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getUnreadNotificationCount',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result: NotificationCountData = { count };

    yield* Effect.logDebug('Unread notification count fetched successfully', {
      userId,
      count,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.logError('Failed to fetch unread notification count', {
          userId,
          error: err instanceof Error ? err.message : String(err),
          errorType: err instanceof Error ? err.constructor.name : typeof err,
        });

        return [
          new DatabaseError({
            message: 'Failed to fetch unread notification count',
          }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, NotificationCountData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Delete a notification
 */
export const deleteNotification = async ({
  notificationId,
}: DeleteNotificationParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ValidationError
    | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting notification', {
      notificationId,
      userId,
    });

    // Check if notification exists and belongs to user
    const notification = yield* Effect.promise(() =>
      db.notification.findUnique({
        where: { id: notificationId },
        select: { personId: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteNotification.fetchNotification',
          notificationId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!notification) {
      yield* Effect.fail(
        new NotFoundError({
          message: `Notification not found`,
          cause: notificationId,
        })
      );
      return;
    }

    if (notification.personId !== userId) {
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to delete this notification',
        })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.notification.delete({
        where: { id: notificationId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteNotification.deleteNotification',
          notificationId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result = { message: 'Notification deleted successfully' };

    yield* Effect.logInfo('Notification deleted successfully', {
      userId,
      notificationId,
      operation: 'delete',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logDebug('Notification not found', {
            userId,
            notificationId,
            operation: 'deleteNotification',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logDebug('User not authorized to delete notification', {
            userId,
            notificationId,
            reason: 'not_owner',
            operation: 'deleteNotification',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError({ message: 'Failed to delete notification' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (
  _params: DeleteAllNotificationsParams
): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | ValidationError | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting all notifications', {
      userId,
    });

    const result = yield* Effect.promise(() =>
      db.notification.deleteMany({
        where: { personId: userId },
      })
    ).pipe(
      Effect.mapError(cause => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteAllNotifications',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const message = `Deleted ${result.count} notifications`;

    yield* Effect.logInfo('All notifications deleted successfully', {
      userId, // Who performed the action
      count: result.count,
      operation: 'delete',
    });

    return { message };
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.succeed([
        new DatabaseError({
          message: 'Failed to delete all notifications',
        }),
        undefined,
      ] as const);
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notifications'))
  );
};

/**
 * Create notification for a specific person (internal use)
 */
export const createTargetedNotification = ({
  personId,
  eventId,
  type,
  authorId,
  postId,
  datetime,
  rsvp,
}: {
  personId: string;
  eventId: string;
  type: CreateEventNotificationsParams['type'];
  authorId?: string;
  postId?: string;
  datetime?: Date | null;
  rsvp?: string | null;
}): Effect.Effect<
  { message: string },
  OperationError | DatabaseError | ConnectionError | ConstraintError,
  never
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating targeted notification', {
      personId,
      eventId,
      type,
      authorId,
    });

    // Create notification for the specific person
    const createdNotification = yield* Effect.promise(() =>
      db.notification.create({
        data: {
          personId,
          authorId,
          eventId,
          postId,
          type: type,
          datetime,
          rsvp: rsvp ? (rsvp as Status) : null,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createTargetedNotification',
          personId,
          eventId,
          type,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Fetch the created notification with relations for Pusher event
    const notificationWithRelations = yield* Effect.promise(() =>
      db.notification.findUnique({
        where: { id: createdNotification.id },
        select: {
          id: true,
          type: true,
          read: true,
          createdAt: true,
          datetime: true,
          rsvp: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.catchAll(() => Effect.succeed(null)) // Don't fail if fetch fails
    );

    // Trigger Pusher event if notification was fetched successfully
    if (notificationWithRelations) {
      const notificationData: NotificationFeedData = {
        id: notificationWithRelations.id,
        type: notificationWithRelations.type,
        read: notificationWithRelations.read,
        createdAt: notificationWithRelations.createdAt,
        datetime: notificationWithRelations.datetime,
        rsvp: notificationWithRelations.rsvp,
        event: notificationWithRelations.event
          ? {
              id: notificationWithRelations.event.id,
              title: notificationWithRelations.event.title,
            }
          : null,
        post: notificationWithRelations.post
          ? {
              id: notificationWithRelations.post.id,
              title: notificationWithRelations.post.title,
            }
          : null,
        author: notificationWithRelations.author
          ? {
              id: notificationWithRelations.author.id,
              user: {
                name: notificationWithRelations.author.user.name,
                email: notificationWithRelations.author.user.email,
                image: notificationWithRelations.author.user.image,
              },
            }
          : null,
      };

      // Trigger Pusher event (fire-and-forget, don't fail if Pusher fails)
      getPusherServer()
        .trigger(`user-${personId}-notifications`, 'notification-changed', {
          type: 'INSERT',
          new: notificationData,
        })
        .catch((err: unknown) => {
          // Log but don't fail - fire-and-forget
          Effect.runPromise(
            Effect.logWarning('Failed to trigger Pusher event', {
              personId,
              notificationId: createdNotification.id,
              error: err instanceof Error ? err.message : String(err),
            })
          ).catch(() => {
            // Ignore logging errors
          });
        });
    }

    const result = { message: 'Created targeted notification' };

    yield* Effect.logInfo('Targeted notification created successfully', {
      authorId: authorId || 'system',
      personId,
      eventId,
      type,
      operation: 'create',
    });

    // Trigger notification delivery processing (fire-and-forget)
    triggerNotificationDelivery(createdNotification.id).catch(() => {
      // Ignore errors - fire-and-forget
    });

    return result;
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.fail(
        new OperationError({
          message: 'Failed to create targeted notification',
        })
      );
    })
  );

  return Effect.provide(effect, createEffectLoggerLayer('notifications'));
};

/**
 * Create notifications for event members (internal use)
 */
export const createEventNotifications = ({
  eventId,
  type,
  authorId,
  postId,
  datetime,
  rsvp,
}: CreateEventNotificationsParams): Effect.Effect<
  { message: string },
  OperationError | DatabaseError | ConnectionError | ConstraintError,
  never
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating event notifications', {
      eventId,
      type,
      authorId,
      postId,
    });

    // Get all event members except the author
    const memberships = yield* Effect.promise(() =>
      db.membership.findMany({
        where: {
          eventId,
          ...(authorId && { personId: { not: authorId } }),
        },
        select: { personId: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createEventNotifications.fetchMembers',
          eventId,
          type,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (memberships.length === 0) {
      const result = { message: 'No members to notify' };
      yield* Effect.logDebug('No members to notify', {
        eventId,
        type,
        authorId,
      });
      return result;
    }

    // Create notifications for all members
    yield* Effect.promise(() =>
      db.notification.createMany({
        data: memberships.map(membership => ({
          personId: membership.personId,
          authorId,
          eventId,
          postId,
          type: type,
          datetime,
          rsvp: rsvp ? (rsvp as Status) : null,
        })),
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createEventNotifications.createNotifications',
          eventId,
          type,
          memberCount: memberships.length,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Fetch created notifications with relations for Pusher events
    const createdNotifications = yield* Effect.promise(() =>
      db.notification.findMany({
        where: {
          eventId,
          type,
          ...(postId && { postId }),
          ...(authorId && { authorId }),
          ...(datetime && { datetime }),
          ...(rsvp && { rsvp }),
          personId: { in: memberships.map(m => m.personId) },
        },
        select: {
          id: true,
          type: true,
          read: true,
          createdAt: true,
          datetime: true,
          rsvp: true,
          personId: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: memberships.length,
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.catchAll(() => Effect.succeed([])) // Don't fail if fetch fails
    );

    // Trigger Pusher events for each notification (fire-and-forget)
    if (createdNotifications.length > 0) {
      const pusherServer = getPusherServer();

      for (const notification of createdNotifications) {
        const notificationData: NotificationFeedData = {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          datetime: notification.datetime,
          rsvp: notification.rsvp,
          event: notification.event
            ? {
                id: notification.event.id,
                title: notification.event.title,
              }
            : null,
          post: notification.post
            ? {
                id: notification.post.id,
                title: notification.post.title,
              }
            : null,
          author: notification.author
            ? {
                id: notification.author.id,
                user: {
                  name: notification.author.user.name,
                  email: notification.author.user.email,
                  image: notification.author.user.image,
                },
              }
            : null,
        };

        // Trigger Pusher event (fire-and-forget)
        pusherServer
          .trigger(
            `user-${notification.personId}-notifications`,
            'notification-changed',
            {
              type: 'INSERT',
              new: notificationData,
            }
          )
          .catch((err: unknown) => {
            // Log but don't fail - fire-and-forget
            Effect.runPromise(
              Effect.logWarning('Failed to trigger Pusher event', {
                personId: notification.personId,
                notificationId: notification.id,
                error: err instanceof Error ? err.message : String(err),
              })
            ).catch(() => {
              // Ignore logging errors
            });
          });
      }
    }

    const result = { message: `Created ${memberships.length} notifications` };

    yield* Effect.logInfo('Event notifications created successfully', {
      authorId: authorId || 'system', // Who triggered the notifications
      eventId,
      type,
      notificationCount: memberships.length,
      operation: 'create',
    });

    // Trigger notification delivery processing for each notification (fire-and-forget)
    if (createdNotifications.length > 0) {
      for (const notification of createdNotifications) {
        triggerNotificationDelivery(notification.id).catch(() => {
          // Ignore errors - fire-and-forget
        });
      }
    }

    return result;
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.fail(
        new OperationError({ message: 'Failed to create event notifications' })
      );
    })
  );

  return Effect.provide(effect, createEffectLoggerLayer('notifications'));
};

/**
 * Create mention notifications for specific mentioned users (internal use)
 */
export const createMentionNotifications = ({
  personIds,
  authorId,
  eventId,
  postId,
}: {
  personIds: string[];
  authorId: string;
  eventId: string;
  postId: string;
}): Effect.Effect<
  { message: string },
  OperationError | DatabaseError | ConnectionError | ConstraintError,
  never
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating mention notifications', {
      personIds,
      authorId,
      eventId,
      postId,
    });

    // Filter out the author to avoid self-mention notifications
    const mentionedPersonIds = personIds.filter(id => id !== authorId);

    if (mentionedPersonIds.length === 0) {
      const result = {
        message: 'No mentioned users to notify (excluding author)',
      };
      yield* Effect.logDebug('No mentioned users to notify', {
        eventId,
        postId,
        authorId,
        originalMentionCount: personIds.length,
      });
      return result;
    }

    // Create notifications for each mentioned person
    yield* Effect.promise(() =>
      db.notification.createMany({
        data: mentionedPersonIds.map(personId => ({
          personId,
          authorId,
          eventId,
          postId,
          type: NotificationType.USER_MENTIONED,
        })),
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createMentionNotifications.createNotifications',
          eventId,
          postId,
          authorId,
          mentionCount: mentionedPersonIds.length,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Fetch created notifications with relations for Pusher events
    const createdNotifications = yield* Effect.promise(() =>
      db.notification.findMany({
        where: {
          eventId,
          postId,
          authorId,
          type: NotificationType.USER_MENTIONED,
          personId: { in: mentionedPersonIds },
        },
        select: {
          id: true,
          type: true,
          read: true,
          createdAt: true,
          datetime: true,
          rsvp: true,
          personId: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: mentionedPersonIds.length,
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.catchAll(() => Effect.succeed([])) // Don't fail if fetch fails
    );

    // Trigger Pusher events for each notification (fire-and-forget)
    if (createdNotifications.length > 0) {
      const pusherServer = getPusherServer();

      for (const notification of createdNotifications) {
        const notificationData: NotificationFeedData = {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          datetime: notification.datetime,
          rsvp: notification.rsvp,
          event: notification.event
            ? {
                id: notification.event.id,
                title: notification.event.title,
              }
            : null,
          post: notification.post
            ? {
                id: notification.post.id,
                title: notification.post.title,
              }
            : null,
          author: notification.author
            ? {
                id: notification.author.id,
                user: {
                  name: notification.author.user.name,
                  email: notification.author.user.email,
                  image: notification.author.user.image,
                },
              }
            : null,
        };

        // Trigger Pusher event (fire-and-forget)
        pusherServer
          .trigger(
            `user-${notification.personId}-notifications`,
            'notification-changed',
            {
              type: 'INSERT',
              new: notificationData,
            }
          )
          .catch((err: unknown) => {
            // Log but don't fail - fire-and-forget
            Effect.runPromise(
              Effect.logWarning('Failed to trigger Pusher event', {
                personId: notification.personId,
                notificationId: notification.id,
                error: err instanceof Error ? err.message : String(err),
              })
            ).catch(() => {
              // Ignore logging errors
            });
          });
      }
    }

    const result = {
      message: `Created ${mentionedPersonIds.length} mention notifications`,
    };

    yield* Effect.logInfo('Mention notifications created successfully', {
      authorId,
      eventId,
      postId,
      notificationCount: mentionedPersonIds.length,
      operation: 'create',
    });

    // Trigger notification delivery processing for each notification (fire-and-forget)
    if (createdNotifications.length > 0) {
      for (const notification of createdNotifications) {
        triggerNotificationDelivery(notification.id).catch(() => {
          // Ignore errors - fire-and-forget
        });
      }
    }

    return result;
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.fail(
        new OperationError({
          message: 'Failed to create mention notifications',
        })
      );
    })
  );

  return Effect.provide(effect, createEffectLoggerLayer('notifications'));
};

import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetNotificationsForPersonParams,
  MarkNotificationAsReadParams,
  MarkNotificationAsUnreadParams,
  MarkAllNotificationsAsReadParams,
  CreateEventNotificationsParams,
} from '@groupi/schema/params';
import { NotificationFeedData } from '@groupi/schema/data';
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

// ============================================================================
// NOTIFICATION DOMAIN SERVICES
// ============================================================================

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

    yield* Effect.logInfo('Notification marked as read successfully', {
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
          yield* Effect.logInfo('Notification not found', {
            userId,
            notificationId,
            operation: 'markNotificationAsRead',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to update notification', {
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

    yield* Effect.logInfo('Notification marked as unread successfully', {
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
          yield* Effect.logInfo('Notification not found', {
            userId,
            notificationId,
            operation: 'markNotificationAsUnread',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to update notification', {
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

    yield* Effect.logInfo('All notifications marked as read successfully', {
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
          rsvp: rsvp,
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

    const result = { message: `Created ${memberships.length} notifications` };

    yield* Effect.logInfo('Event notifications created successfully', {
      authorId: authorId || 'system', // Who triggered the notifications
      eventId,
      type,
      notificationCount: memberships.length,
      operation: 'create',
    });

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

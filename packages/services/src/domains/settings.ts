import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetUserSettingsParams,
  UpdateUserSettingsParams,
} from '@groupi/schema/params';
import {
  SettingsPageData,
  NotificationMethodSettingsData,
} from '@groupi/schema/data';
import {
  NotFoundError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
  OperationError,
  AuthenticationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { NotificationType } from '@prisma/client';

// ============================================================================
// SETTINGS DOMAIN SERVICES
// ============================================================================

/**
 * Fetch user settings page data
 */
export const fetchUserSettings = async (
  _params: GetUserSettingsParams
): Promise<
  ResultTuple<
    NotFoundError | DatabaseError | ConnectionError | AuthenticationError,
    SettingsPageData
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
    yield* Effect.logDebug('Fetching user settings', {
      userId,
    });

    // Database operation with retry for connection issues
    const settingsData = yield* Effect.promise(() =>
      db.personSettings.findUnique({
        where: { personId: userId },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          personId: true,
          notificationMethods: {
            select: {
              id: true,
              type: true,
              enabled: true,
              name: true,
              value: true,
              webhookHeaders: true,
              customTemplate: true,
              webhookFormat: true,
              notifications: {
                select: {
                  notificationType: true,
                  enabled: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) =>
        getPrismaError('PersonSettings', cause)
      ),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchUserSettings',
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

    if (!settingsData) {
      return [
        new NotFoundError({
          message: `User settings not found`,
          cause: userId,
        }),
        undefined,
      ];
    }

    // Direct construction
    // Ensure notificationMethods is always an array (safety check)
    // Prisma should return empty array for empty relations, but defensive check ensures
    // we never get undefined even if there's a race condition or Prisma edge case
    const notificationMethods = settingsData.notificationMethods || [];

    const result: SettingsPageData = {
      id: settingsData.id,
      createdAt: settingsData.createdAt,
      updatedAt: settingsData.updatedAt,
      personId: settingsData.personId,
      notificationMethods: notificationMethods.map(method => ({
        id: method.id,
        type: method.type,
        enabled: method.enabled,
        name: method.name,
        value: method.value,
        webhookHeaders: method.webhookHeaders,
        customTemplate: method.customTemplate,
        webhookFormat: method.webhookFormat,
        notifications: method.notifications.map(notification => ({
          notificationType: notification.notificationType,
          enabled: notification.enabled,
        })),
      })),
    };

    yield* Effect.logDebug('User settings fetched successfully', {
      userId,
      methodCount: result.notificationMethods.length,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logInfo('User settings not found', {
            userId,
            operation: 'fetchUserSettings',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError({ message: 'Failed to fetch user settings' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, SettingsPageData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('settings'))
  );
};

/**
 * Update user notification settings
 */
export const updateUserSettings = async (
  input: UpdateUserSettingsParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | OperationError
    | AuthenticationError,
    NotificationMethodSettingsData[]
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

  const { notificationMethods } = input;
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating user settings', {
      userId,
      methodCount: notificationMethods.length,
    });

    // Ensure user settings exist
    yield* Effect.promise(() =>
      db.personSettings.upsert({
        where: { personId: userId },
        create: { personId: userId },
        update: {},
      })
    ).pipe(
      Effect.mapError(cause => getPrismaError('PersonSettings', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateUserSettings.ensureSettings',
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

    // Delete existing notification methods
    yield* Effect.promise(() =>
      db.notificationMethod.deleteMany({
        where: {
          settings: { personId: userId },
        },
      })
    ).pipe(
      Effect.mapError(
        cause =>
          new DatabaseError({
            message: 'Failed to delete existing notification methods',
            cause,
          })
      ),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateUserSettings.deleteExisting',
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

    // Create new notification methods
    const createdMethods: NotificationMethodSettingsData[] = [];
    for (const method of notificationMethods) {
      // Resolve email from user account if EMAIL method has empty value
      let resolvedValue = method.value;
      if (
        method.type === 'EMAIL' &&
        (!method.value || method.value.trim() === '')
      ) {
        const user = yield* Effect.promise(() =>
          db.user.findUnique({
            where: { id: userId },
            select: { email: true },
          })
        ).pipe(
          Effect.mapError(cause => getPrismaError('User', cause)),
          Effect.tapError(error =>
            Effect.logError('Database operation encountered error', {
              operation: 'updateUserSettings.fetchUserEmail',
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

        if (!user || !user.email) {
          yield* Effect.fail(
            new ValidationError({
              message:
                'User email not found. Cannot create email notification method.',
            })
          );
          return;
        }

        resolvedValue = user.email;
        yield* Effect.logDebug('Resolved email from user account', {
          userId,
          email: user.email,
        });
      }

      const notificationMethod = yield* Effect.promise(() =>
        db.notificationMethod.create({
          data: {
            settings: { connect: { personId: userId } },
            type: method.type,
            name: method.name,
            value: resolvedValue,
            enabled: method.enabled,
            webhookFormat: method.webhookFormat,
            customTemplate: method.customTemplate,
            webhookHeaders: method.webhookHeaders || undefined,
            notifications: {
              create: method.notifications.map(notification => ({
                notificationType: notification.notificationType,
                enabled: notification.enabled,
              })),
            },
          },
          select: {
            id: true,
            type: true,
            enabled: true,
            name: true,
            value: true,
            webhookHeaders: true,
            customTemplate: true,
            webhookFormat: true,
            notifications: {
              select: {
                notificationType: true,
                enabled: true,
              },
            },
          },
        })
      ).pipe(
        Effect.mapError(cause => getPrismaError('NotificationMethod', cause)),
        Effect.tapError(error =>
          Effect.logError('Database operation encountered error', {
            operation: 'updateUserSettings.createMethod',
            userId,
            methodType: method.type,
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

      createdMethods.push({
        id: notificationMethod.id,
        type: notificationMethod.type,
        enabled: notificationMethod.enabled,
        name: notificationMethod.name,
        value: notificationMethod.value,
        webhookHeaders: notificationMethod.webhookHeaders,
        customTemplate: notificationMethod.customTemplate,
        webhookFormat: notificationMethod.webhookFormat,
        notifications: (notificationMethod.notifications || []).map(
          (notification: {
            notificationType: NotificationType;
            enabled: boolean;
          }) => ({
            notificationType: notification.notificationType,
            enabled: notification.enabled,
          })
        ),
      });
    }

    yield* Effect.logInfo('User settings updated successfully', {
      userId, // Who performed the action
      methodCount: createdMethods.length,
      operation: 'update',
    });

    return createdMethods;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Check for specific error types
        if (err instanceof Error && err.message.includes('not found')) {
          yield* Effect.logInfo('User settings not found', {
            userId,
            operation: 'updateUserSettings',
          });
          return [
            new NotFoundError({
              message: `User settings not found`,
              cause: userId,
            }),
            undefined,
          ] as const;
        }

        // For unexpected errors, return SettingsUpdateError
        return [
          new DatabaseError({ message: 'Failed to update user settings' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, NotificationMethodSettingsData[]]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('settings'))
  );
};

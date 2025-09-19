import { Effect } from 'effect';
import { z } from 'zod';
import {
  UserNotificationSettingsDTO,
  UpdateUserSettingsInput,
} from '@groupi/schema';
import { db } from './db';
import { SentryHelpers } from './sentry';
import { safeWrapper } from './shared/safe-wrapper';
import { OperationSuccessSchema } from './shared/operations';

// Import shared patterns
import { dbOperation } from './shared/effect-patterns';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class SettingsNotFoundError extends Error {
  readonly _tag = 'SettingsNotFoundError';
  constructor(userId: string) {
    super(`Settings not found for user: ${userId}`);
  }
}

export class SettingsUserNotFoundError extends Error {
  readonly _tag = 'SettingsUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class SettingsUpdateError extends Error {
  readonly _tag = 'SettingsUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update settings');
    if (cause) {
      this.cause = cause;
    }
  }
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to fetch user settings
export const fetchUserSettingsEffect = (userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch user settings with notification methods (database operation with retry)
      const settings = yield* _(
        dbOperation(
          () =>
            db.personSettings.findUnique({
              where: {
                personId: userId,
              },
              include: {
                notificationMethods: {
                  include: {
                    notifications: true,
                  },
                },
              },
            }),
          _error => new SettingsNotFoundError(userId),
          `Fetch user settings: ${userId}`
        )
      );

      if (!settings) {
        return yield* _(Effect.fail(new SettingsNotFoundError(userId)));
      }

      return settings;
    }),
    'settings',
    'fetchUserSettings',
    userId
  );

// Modernized Effect-based function to update user settings
export const updateUserSettingsEffect = (
  settingsData: UpdateUserSettingsInput,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Get the user's settings record (database operation with retry)
      const settings = yield* _(
        dbOperation(
          () =>
            db.personSettings.findUnique({
              where: { personId: userId },
            }),
          _error => new SettingsNotFoundError(userId),
          `Fetch user settings for update: ${userId}`
        )
      );

      if (!settings) {
        return yield* _(Effect.fail(new SettingsNotFoundError(userId)));
      }

      // Remove all existing notification methods for this user (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.notificationMethod.deleteMany({
              where: { settingsId: settings.id },
            }),
          _error => new SettingsUpdateError(_error),
          `Delete existing notification methods for user: ${userId}`
        )
      );

      // Add all new/updated notification methods (database operation with retry)
      for (const method of settingsData.notificationMethods) {
        // Prepare base data - properly typed for Prisma
        const baseData = {
          type: method.type,
          value: method.value,
          enabled: method.enabled,
          settingsId: settings.id,
          name: method.name,
          notifications: {
            create: method.notifications.map(n => ({
              notificationType: n.notificationType,
              enabled: n.enabled,
            })),
          },
        };

        // Only include webhook-specific fields for WEBHOOK methods
        if (method.type === 'WEBHOOK') {
          const methodData = {
            ...baseData,
            webhookFormat: method.webhookFormat,
            customTemplate: method.customTemplate,
            webhookHeaders: method.webhookHeaders
              ? JSON.parse(method.webhookHeaders)
              : null,
          };

          yield* _(
            dbOperation(
              () =>
                db.notificationMethod.create({
                  data: methodData,
                }),
              _error => new SettingsUpdateError(_error),
              `Create webhook notification method for user: ${userId}`
            )
          );
        } else {
          yield* _(
            dbOperation(
              () =>
                db.notificationMethod.create({
                  data: baseData,
                }),
              _error => new SettingsUpdateError(_error),
              `Create notification method for user: ${userId}`
            )
          );
        }
      }

      return true;
    }),
    'settings',
    'updateUserSettings',
    userId
  );

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for user settings data - matches the DTO
const UserSettingsSchema = UserNotificationSettingsDTO;

// ============================================================================
// SAFE WRAPPER FUNCTIONS (Public API)
// ============================================================================

export const fetchUserSettings = safeWrapper<
  [string],
  z.infer<typeof UserSettingsSchema>,
  SettingsNotFoundError | SettingsUserNotFoundError
>(
  (userId: string) => Effect.runPromise(fetchUserSettingsEffect(userId)),
  UserSettingsSchema
);

export const updateUserSettings = safeWrapper<
  [UpdateUserSettingsInput, string],
  z.infer<typeof OperationSuccessSchema>,
  SettingsNotFoundError | SettingsUpdateError
>(
  (settingsData: UpdateUserSettingsInput, userId: string) =>
    Effect.runPromise(
      updateUserSettingsEffect(settingsData, userId).pipe(
        Effect.map(() => ({ success: true }))
      )
    ),
  OperationSuccessSchema
);

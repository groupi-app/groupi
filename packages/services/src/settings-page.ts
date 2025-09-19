import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  SettingsPageResult,
  SettingsPageData,
  SettingsPageError,
  SettingsPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// SETTINGS PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Settings page
 * Returns user settings with notification methods
 */
export const getSettingsPageData = async (
  userId: string
): Promise<SettingsPageResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch user settings with notification methods
      const settingsData = yield* dbOperation(
        () =>
          db.personSettings.findUnique({
            where: {
              personId: userId,
            },
            select: {
              id: true,
              personId: true,
              createdAt: true,
              updatedAt: true,
              notificationMethods: {
                select: {
                  id: true,
                  type: true,
                  value: true,
                  enabled: true,
                  createdAt: true,
                  updatedAt: true,
                  notifications: {
                    select: {
                      id: true,
                      type: true,
                      read: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch settings data: ${cause}`),
        `fetch settings page data for ${userId}`
      );

      if (!settingsData) {
        return error<SettingsPageError>({
          _tag: 'SettingsNotFoundError',
          message: 'Settings not found for user',
        });
      }

      const result: SettingsPageData = settingsData;

      // Validate result against schema
      const validatedResult = SettingsPageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getSettingsPageData:', err);
        return Effect.succeed(
          error<SettingsPageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'settings-page',
    'getSettingsPageData',
    userId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getSettingsPageData effect:', err);
    return error<SettingsPageError>({
      _tag: 'DatabaseError',
      message: err instanceof Error ? err.message : 'Failed to fetch settings',
    });
  }
};

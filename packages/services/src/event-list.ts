import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import type {
  EventListResult,
  EventListData,
  EventListError,
  EventListDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT LIST EFFECT SERVICE
// ============================================================================

/**
 * Fetches data needed for the EventList component
 * Returns user data with their event memberships
 */
export const getEventListData = async (
  userId: string
): Promise<EventListResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch person with their memberships and events using dbOperation pattern
      const personData = yield* dbOperation(
        () =>
          db.person.findFirst({
            where: { id: userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              imageUrl: true,
              memberships: {
                select: {
                  id: true,
                  role: true,
                  rsvpStatus: true,
                  event: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      location: true,
                      chosenDateTime: true,
                      createdAt: true,
                    },
                  },
                },
                orderBy: {
                  event: { createdAt: 'desc' },
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch event list data: ${cause}`),
        `fetch event list data for ${userId}`
      );

      if (!personData) {
        return error<EventListError>({
          _tag: 'PersonNotFoundError',
          message: 'Person not found',
        });
      }

      const result: EventListData = {
        person: personData,
      };

      // Validate result against schema
      const validatedResult = EventListDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        return Effect.succeed(
          error<EventListError>({
            _tag: 'PersonNotFoundError',
            message:
              err instanceof Error ? err.message : 'Service error occurred',
          })
        );
      })
    ),
    'event-list',
    'getEventListData',
    userId
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(effect);
};

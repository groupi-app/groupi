import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  MyEventsResult,
  MyEventsData,
  MyEventsError,
  MyEventsDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// MY EVENTS PAGE SERVICE
// ============================================================================

/**
 * Fetches all events for a user through their memberships
 * Returns events with member information for display
 */
export const getMyEventsData = async (
  userId: string
): Promise<MyEventsResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch user's memberships with events and event members
      const personData = yield* dbOperation(
        () =>
          db.person.findUnique({
            where: { id: userId },
            select: {
              memberships: {
                select: {
                  event: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      location: true,
                      chosenDateTime: true,
                      createdAt: true,
                      updatedAt: true,
                      memberships: {
                        select: {
                          id: true,
                          personId: true,
                          role: true,
                          rsvpStatus: true,
                          person: {
                            select: {
                              id: true,
                              name: true,
                              profilePhoto: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch user events: ${cause}`),
        `fetch my events data for ${userId}`
      );

      if (!personData) {
        return error<MyEventsError>({
          _tag: 'UserNotFoundError',
          message: 'User not found',
        });
      }

      const result: MyEventsData = {
        memberships: personData.memberships,
      };

      // Validate result against schema
      const validatedResult = MyEventsDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getMyEventsData:', err);
        return Effect.succeed(
          error<MyEventsError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'my-events-page',
    'getMyEventsData',
    userId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getMyEventsData effect:', err);
    return error<MyEventsError>({
      _tag: 'DatabaseError',
      message: err instanceof Error ? err.message : 'Failed to fetch events',
    });
  }
};

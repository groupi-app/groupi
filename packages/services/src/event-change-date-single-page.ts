import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventChangeDateSinglePageResult,
  EventChangeDateSinglePageData,
  EventChangeDateSinglePageError,
  EventChangeDateSinglePageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT CHANGE DATE SINGLE PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Change Date Single page
 * Returns event info with current date and verifies user is an organizer
 */
export const getEventChangeDateSinglePageData = async (
  eventId: string,
  userId: string
): Promise<EventChangeDateSinglePageResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch event with user membership
      const eventData = yield* dbOperation(
        () =>
          db.event.findFirst({
            where: { id: eventId },
            select: {
              id: true,
              title: true,
              chosenDateTime: true,
              memberships: {
                where: { personId: userId },
                select: {
                  role: true,
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch event data: ${cause}`),
        `fetch event data for change date single ${eventId}`
      );

      if (!eventData) {
        return error<EventChangeDateSinglePageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Check if user is a member
      if (eventData.memberships.length === 0) {
        return error<EventChangeDateSinglePageError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userRole = eventData.memberships[0].role;

      // Check if user is an organizer
      if (userRole !== 'ORGANIZER') {
        return error<EventChangeDateSinglePageError>({
          _tag: 'UnauthorizedError',
          message: 'Only organizers can change event dates',
        });
      }

      const result: EventChangeDateSinglePageData = {
        event: {
          id: eventData.id,
          title: eventData.title,
          chosenDateTime: eventData.chosenDateTime,
        },
        userRole,
      };

      // Validate result against schema
      const validatedResult = EventChangeDateSinglePageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getEventChangeDateSinglePageData:', err);
        return Effect.succeed(
          error<EventChangeDateSinglePageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'event-change-date-single-page',
    'getEventChangeDateSinglePageData',
    eventId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error(
      'Failed to run getEventChangeDateSinglePageData effect:',
      err
    );
    return error<EventChangeDateSinglePageError>({
      _tag: 'DatabaseError',
      message:
        err instanceof Error ? err.message : 'Failed to fetch event data',
    });
  }
};

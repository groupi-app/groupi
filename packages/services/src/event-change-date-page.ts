import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventChangeDatePageResult,
  EventChangeDatePageData,
  EventChangeDatePageError,
  EventChangeDatePageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT CHANGE DATE PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Change Date page
 * Returns event info and verifies user is an organizer
 */
export const getEventChangeDatePageData = async (
  eventId: string,
  userId: string
): Promise<EventChangeDatePageResult> => {
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
              memberships: {
                where: { personId: userId },
                select: {
                  role: true,
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch event data: ${cause}`),
        `fetch event data for change date ${eventId}`
      );

      if (!eventData) {
        return error<EventChangeDatePageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Check if user is a member
      if (eventData.memberships.length === 0) {
        return error<EventChangeDatePageError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userRole = eventData.memberships[0].role;

      // Check if user is an organizer
      if (userRole !== 'ORGANIZER') {
        return error<EventChangeDatePageError>({
          _tag: 'UnauthorizedError',
          message: 'Only organizers can change event dates',
        });
      }

      const result: EventChangeDatePageData = {
        event: {
          id: eventData.id,
          title: eventData.title,
        },
        userRole,
      };

      // Validate result against schema
      const validatedResult = EventChangeDatePageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getEventChangeDatePageData:', err);
        return Effect.succeed(
          error<EventChangeDatePageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'event-change-date-page',
    'getEventChangeDatePageData',
    eventId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getEventChangeDatePageData effect:', err);
    return error<EventChangeDatePageError>({
      _tag: 'DatabaseError',
      message:
        err instanceof Error ? err.message : 'Failed to fetch event data',
    });
  }
};

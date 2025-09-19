import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventChangeDateMultiPageResult,
  EventChangeDateMultiPageData,
  EventChangeDateMultiPageError,
  EventChangeDateMultiPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT CHANGE DATE MULTI PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Change Date Multi page
 * Returns event info with potential date times and verifies user is an organizer
 */
export const getEventChangeDateMultiPageData = async (
  eventId: string,
  userId: string
): Promise<EventChangeDateMultiPageResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch event with user membership and potential date times
      const eventData = yield* dbOperation(
        () =>
          db.event.findFirst({
            where: { id: eventId },
            select: {
              id: true,
              title: true,
              potentialDateTimes: {
                select: {
                  id: true,
                  dateTime: true,
                },
              },
              memberships: {
                where: { personId: userId },
                select: {
                  role: true,
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch event data: ${cause}`),
        `fetch event data for change date multi ${eventId}`
      );

      if (!eventData) {
        return error<EventChangeDateMultiPageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Check if user is a member
      if (eventData.memberships.length === 0) {
        return error<EventChangeDateMultiPageError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userRole = eventData.memberships[0].role;

      // Check if user is an organizer
      if (userRole !== 'ORGANIZER') {
        return error<EventChangeDateMultiPageError>({
          _tag: 'UnauthorizedError',
          message: 'Only organizers can change event dates',
        });
      }

      const result: EventChangeDateMultiPageData = {
        event: {
          id: eventData.id,
          title: eventData.title,
          potentialDateTimes:
            eventData.potentialDateTimes.length > 0
              ? eventData.potentialDateTimes
              : undefined,
        },
        userRole,
      };

      // Validate result against schema
      const validatedResult = EventChangeDateMultiPageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getEventChangeDateMultiPageData:', err);
        return Effect.succeed(
          error<EventChangeDateMultiPageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'event-change-date-multi-page',
    'getEventChangeDateMultiPageData',
    eventId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getEventChangeDateMultiPageData effect:', err);
    return error<EventChangeDateMultiPageError>({
      _tag: 'DatabaseError',
      message:
        err instanceof Error ? err.message : 'Failed to fetch event data',
    });
  }
};

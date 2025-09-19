import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventEditPageResult,
  EventEditPageData,
  EventEditPageError,
  EventEditPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT EDIT PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Edit page
 * Returns event details and verifies user is an organizer
 */
export const getEventEditPageData = async (
  eventId: string,
  userId: string
): Promise<EventEditPageResult> => {
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
              description: true,
              location: true,
              memberships: {
                where: { personId: userId },
                select: {
                  role: true,
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch event data: ${cause}`),
        `fetch event data for edit ${eventId}`
      );

      if (!eventData) {
        return error<EventEditPageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Check if user is a member
      if (eventData.memberships.length === 0) {
        return error<EventEditPageError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userRole = eventData.memberships[0].role;

      // Check if user is an organizer
      if (userRole !== 'ORGANIZER') {
        return error<EventEditPageError>({
          _tag: 'UnauthorizedError',
          message: 'Only organizers can edit events',
        });
      }

      const result: EventEditPageData = {
        event: {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
        },
        userRole,
      };

      // Validate result against schema
      const validatedResult = EventEditPageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getEventEditPageData:', err);
        return Effect.succeed(
          error<EventEditPageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'event-edit-page',
    'getEventEditPageData',
    eventId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getEventEditPageData effect:', err);
    return error<EventEditPageError>({
      _tag: 'DatabaseError',
      message: err instanceof Error ? err.message : 'Failed to fetch event data',
    });
  }
};

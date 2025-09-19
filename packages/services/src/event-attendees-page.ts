import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventAttendeesPageResult,
  EventAttendeesPageData,
  EventAttendeesPageError,
  EventAttendeesPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT ATTENDEES PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Attendees page
 * Returns event title, chosen date, and full membership list with person details
 */
export const getEventAttendeesPageData = async (
  eventId: string,
  userId: string
): Promise<EventAttendeesPageResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch event with memberships and person data
      const eventData = yield* dbOperation(
        () =>
          db.event.findFirst({
            where: { id: eventId },
            select: {
              id: true,
              title: true,
              chosenDateTime: true,
              memberships: {
                select: {
                  id: true,
                  role: true,
                  rsvpStatus: true,
                  personId: true,
                  eventId: true,
                  person: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch event attendees data: ${cause}`),
        `fetch event attendees data for ${eventId}`
      );

      if (!eventData) {
        return error<EventAttendeesPageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Check if user is a member
      const userMembership = eventData.memberships.find(
        m => m.person.id === userId
      );

      if (!userMembership) {
        return error<EventAttendeesPageError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const result: EventAttendeesPageData = {
        event: eventData,
      };

      // Validate result against schema
      const validatedResult = EventAttendeesPageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getEventAttendeesPageData:', err);
        return Effect.succeed(
          error<EventAttendeesPageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'event-attendees-page',
    'getEventAttendeesPageData',
    eventId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getEventAttendeesPageData effect:', err);
    return error<EventAttendeesPageError>({
      _tag: 'DatabaseError',
      message: err instanceof Error ? err.message : 'Failed to fetch attendees',
    });
  }
};

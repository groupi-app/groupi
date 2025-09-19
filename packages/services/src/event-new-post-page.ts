import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventNewPostPageResult,
  EventNewPostPageData,
  EventNewPostPageError,
  EventNewPostPageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT NEW POST PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event New Post page
 * Returns basic event info and user role for authorization
 */
export const getEventNewPostPageData = async (
  eventId: string,
  userId: string
): Promise<EventNewPostPageResult> => {
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
        `fetch event data for new post ${eventId}`
      );

      if (!eventData) {
        return error<EventNewPostPageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Check if user is a member
      if (eventData.memberships.length === 0) {
        return error<EventNewPostPageError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const result: EventNewPostPageData = {
        event: {
          id: eventData.id,
          title: eventData.title,
        },
        userRole: eventData.memberships[0].role,
      };

      // Validate result against schema
      const validatedResult = EventNewPostPageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getEventNewPostPageData:', err);
        return Effect.succeed(
          error<EventNewPostPageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'event-new-post-page',
    'getEventNewPostPageData',
    eventId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getEventNewPostPageData effect:', err);
    return error<EventNewPostPageError>({
      _tag: 'DatabaseError',
      message: err instanceof Error ? err.message : 'Failed to fetch event data',
    });
  }
};

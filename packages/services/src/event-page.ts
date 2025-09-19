import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  EventHeaderResult,
  EventHeaderData,
  EventHeaderError,
  EventHeaderDataSchema,
  MemberListResult,
  MemberListData,
  MemberListError,
  MemberListDataSchema,
  PostFeedResult,
  PostFeedData,
  PostFeedError,
  PostFeedDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// EVENT PAGE COMPONENT SERVICES
// ============================================================================

/**
 * Fetches data needed for the EventHeader component
 * Returns only the fields required for event header display
 */
export const getEventHeaderData = async (
  eventId: string,
  userId: string
): Promise<EventHeaderResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch event with user membership using dbOperation pattern
      const eventData = yield* dbOperation(
        () =>
          db.event.findFirst({
            where: { id: eventId },
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              chosenDateTime: true,
              memberships: {
                where: { personId: userId },
                select: {
                  id: true,
                  role: true,
                  rsvpStatus: true,
                },
                take: 1,
              },
            },
          }),
        cause => new Error(`Failed to fetch event data: ${cause}`),
        `fetch event header data for ${eventId}`
      );

      if (!eventData) {
        return error<EventHeaderError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      if (eventData.memberships.length === 0) {
        return error<EventHeaderError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userMembership = eventData.memberships[0];

      const result: EventHeaderData = {
        event: {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          chosenDateTime: eventData.chosenDateTime,
        },
        userMembership: {
          id: userMembership.id,
          role: userMembership.role,
          rsvpStatus: userMembership.rsvpStatus,
        },
      };

      // Validate result against schema
      const validatedResult = EventHeaderDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        return Effect.succeed(
          error<EventHeaderError>({
            _tag: 'EventNotFoundError',
            message:
              err instanceof Error ? err.message : 'Service error occurred',
          })
        );
      })
    ),
    'event-page',
    'getHeaderData',
    eventId
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(effect);
};

/**
 * Fetches data needed for the MemberList component
 * Returns only the fields required for member list display
 */
export const getMemberListData = async (
  eventId: string,
  userId: string
): Promise<MemberListResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch event with memberships using dbOperation pattern
      const eventData = yield* dbOperation(
        () =>
          db.event.findFirst({
            where: { id: eventId },
            select: {
              id: true,
              chosenDateTime: true,
              memberships: {
                select: {
                  id: true,
                  role: true,
                  rsvpStatus: true,
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
                orderBy: [
                  { role: 'desc' }, // ORGANIZER first, then MODERATOR, then ATTENDEE
                  { person: { firstName: 'asc' } },
                ],
              },
            },
          }),
        cause => new Error(`Failed to fetch member data: ${cause}`),
        `fetch member list data for ${eventId}`
      );

      if (!eventData) {
        return error<MemberListError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      // Find user's membership
      const userMembership = eventData.memberships.find(
        m => m.person.id === userId
      );

      if (!userMembership) {
        return error<MemberListError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const result: MemberListData = {
        event: {
          id: eventData.id,
          chosenDateTime: eventData.chosenDateTime,
          memberships: eventData.memberships,
        },
        userMembership: {
          id: userMembership.id,
          role: userMembership.role,
        },
        userId,
      };

      // Validate result against schema
      const validatedResult = MemberListDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        return Effect.succeed(
          error<MemberListError>({
            _tag: 'EventNotFoundError',
            message:
              err instanceof Error ? err.message : 'Service error occurred',
          })
        );
      })
    ),
    'event-page',
    'getMemberListData',
    eventId
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(effect);
};

/**
 * Fetches data needed for the PostFeed component
 * Returns only the fields required for post feed display
 */
export const getPostFeedData = async (
  eventId: string,
  userId: string
): Promise<PostFeedResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch event with posts using dbOperation pattern
      const eventData = yield* dbOperation(
        () =>
          db.event.findFirst({
            where: { id: eventId },
            select: {
              id: true,
              chosenDateTime: true,
              posts: {
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  updatedAt: true,
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                      imageUrl: true,
                    },
                  },
                  _count: {
                    select: {
                      replies: true,
                    },
                  },
                },
                orderBy: { updatedAt: 'desc' },
              },
              memberships: {
                where: { personId: userId },
                select: {
                  id: true,
                  role: true,
                },
                take: 1,
              },
            },
          }),
        cause => new Error(`Failed to fetch post data: ${cause}`),
        `fetch post feed data for ${eventId}`
      );

      if (!eventData) {
        return error<PostFeedError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }

      if (eventData.memberships.length === 0) {
        return error<PostFeedError>({
          _tag: 'EventUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userMembership = eventData.memberships[0];

      const result: PostFeedData = {
        event: {
          id: eventData.id,
          chosenDateTime: eventData.chosenDateTime,
          posts: eventData.posts,
        },
        userMembership: {
          id: userMembership.id,
          role: userMembership.role,
        },
      };

      // Validate result against schema
      const validatedResult = PostFeedDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        return Effect.succeed(
          error<PostFeedError>({
            _tag: 'EventNotFoundError',
            message:
              err instanceof Error ? err.message : 'Service error occurred',
          })
        );
      })
    ),
    'event-page',
    'getPostFeedData',
    eventId
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(effect);
};

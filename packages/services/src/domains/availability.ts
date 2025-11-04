import { Effect, Schedule } from 'effect';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import { getUserId } from './auth-helpers';
import type { ResultTuple } from '@groupi/schema';
import {
  GetMyAvailabilitiesParams,
  GetEventPotentialDateTimesParams,
  UpdateMemberAvailabilitiesParams,
  ChooseDateTimeParams,
} from '@groupi/schema/params';
import { AvailabilityPageData } from '@groupi/schema/data';
import {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
  OperationError,
  AuthenticationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { createEventNotifications } from './notification';

// ============================================================================
// AVAILABILITY DOMAIN SERVICES
// ============================================================================

/**
 * Get current user's availability statuses for an event's potential date times
 */
export const getMyAvailabilities = async ({
  eventId,
}: GetMyAvailabilitiesParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError,
    Array<{ potentialDateTimeId: string; status: string }>
  >
> => {
  // Get auth outside Effect.gen
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching user availabilities', {
      eventId,
      userId,
    });

    // Check if user is a member of the event
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: { personId: userId, eventId },
        select: { id: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getMyAvailabilities.checkMembership',
              eventId,
              userId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!membership) {
      yield* Effect.logInfo('User not authorized to view availabilities', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'getMyAvailabilities',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not a member of this event' })
      );
      return;
    }

    // Get user's availability statuses
    const statuses = yield* Effect.promise(() =>
      db.availability.findMany({
        where: { membershipId: membership.id },
        select: { potentialDateTimeId: true, status: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Availability', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getMyAvailabilities.fetchAvailabilities',
              eventId,
              userId,
              membershipId: membership.id,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    yield* Effect.logDebug('User availabilities fetched successfully', {
      eventId,
      userId,
      statusCount: statuses.length,
    });

    return statuses;
  }).pipe(
    Effect.map(
      result =>
        [
          null,
          result as Array<{ potentialDateTimeId: string; status: string }>,
        ] as [null, Array<{ potentialDateTimeId: string; status: string }>]
    ),
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        if (
          err instanceof UnauthorizedError ||
          err instanceof ConnectionError ||
          err instanceof DatabaseError
        ) {
          return [err, undefined] as [
            UnauthorizedError | ConnectionError | DatabaseError,
            undefined,
          ];
        }
        return [
          new DatabaseError({ message: 'Failed to fetch availabilities' }),
          undefined,
        ] as [DatabaseError, undefined];
      });
    })
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('availability'))
  );
};

/**
 * Get event potential date times with availability data
 */
export const getEventPotentialDateTimes = async ({
  eventId,
}: GetEventPotentialDateTimesParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    AvailabilityPageData
  >
> => {
  // Get auth outside Effect.gen
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching event potential date times', {
      eventId,
      userId,
    });

    // Database operation with retry
    const eventData = yield* Effect.promise(() =>
      db.event.findUnique({
        where: { id: eventId },
        include: {
          potentialDateTimes: {
            include: {
              availabilities: {
                include: {
                  membership: {
                    select: {
                      id: true,
                      personId: true,
                      eventId: true,
                      role: true,
                      rsvpStatus: true,
                      person: {
                        select: {
                          id: true,
                          user: {
                            select: {
                              name: true,
                              email: true,
                              image: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          memberships: {
            where: { personId: userId },
            take: 1,
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getEventPotentialDateTimes',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!eventData) {
      yield* Effect.logInfo('Event not found for availability data', {
        userId,
        eventId,
        operation: 'getEventPotentialDateTimes',
      });
      return yield* Effect.fail(
        new NotFoundError({ message: `Event not found`, cause: eventId })
      );
    }

    if (eventData.memberships.length === 0) {
      yield* Effect.logInfo('User not authorized to view availability data', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'getEventPotentialDateTimes',
      });
      return yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to access this event',
        })
      );
    }

    const userMembership = eventData.memberships[0];

    // Direct construction
    const result: AvailabilityPageData = {
      potentialDateTimes: eventData.potentialDateTimes.map(
        (pdt: {
          id: string;
          dateTime: Date;
          availabilities: Array<{
            status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
            membership: {
              id: string;
              personId: string;
              eventId: string;
              role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
              rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
              person: {
                id: string;
                user: {
                  name: string | null;
                  email: string;
                  image: string | null;
                };
              };
            };
          }>;
        }) => ({
          id: pdt.id,
          eventId: eventId,
          dateTime: pdt.dateTime,
          availabilities: pdt.availabilities.map(availability => ({
            status: availability.status,
            membership: {
              id: availability.membership.id,
              personId: availability.membership.personId,
              eventId: availability.membership.eventId,
              role: availability.membership.role,
              rsvpStatus: availability.membership.rsvpStatus,
              person: {
                id: availability.membership.person.id,
                user: {
                  name: availability.membership.person.user.name,
                  email: availability.membership.person.user.email,
                  image: availability.membership.person.user.image,
                },
              },
            },
          })),
        })
      ),
      userRole: userMembership.role,
      userId: userId,
    };

    yield* Effect.logDebug('Event potential date times fetched successfully', {
      eventId,
      userId,
      potentialDateTimesCount: result.potentialDateTimes.length,
    });

    return result;
  }).pipe(
    Effect.map(result => [null, result] as [null, AvailabilityPageData]),
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        if (
          err instanceof UnauthorizedError ||
          err instanceof ConnectionError ||
          err instanceof DatabaseError
        ) {
          return [err, undefined] as [
            UnauthorizedError | ConnectionError | DatabaseError,
            undefined,
          ];
        }
        return [
          new DatabaseError({
            message: 'Failed to fetch potential date times',
          }),
          undefined,
        ] as [DatabaseError, undefined];
      });
    })
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('availability'))
  );
};

/**
 * Update member availabilities for an event
 */
export const updateMemberAvailabilities = async (
  input: UpdateMemberAvailabilitiesParams
): Promise<
  ResultTuple<
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    { message: string }
  >
> => {
  const { eventId, availabilities } = input;

  // Get auth outside Effect.gen
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating member availabilities', {
      eventId,
      userId,
      availabilityCount: availabilities.length,
    });

    // Check if user is a member
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: {
          eventId,
          personId: userId,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateMemberAvailabilities.checkMembership',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!membership) {
      yield* Effect.logInfo('User not authorized to update availabilities', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'updateMemberAvailabilities',
      });
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to update availabilities for this event',
        })
      );
      return;
    }

    // Delete existing availabilities for this membership
    yield* Effect.promise(() =>
      db.availability.deleteMany({
        where: {
          membershipId: membership.id,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Availability', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateMemberAvailabilities.deleteExisting',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Create new availabilities
    yield* Effect.promise(() =>
      db.availability.createMany({
        data: availabilities.map(availability => ({
          membershipId: membership.id,
          potentialDateTimeId: availability.potentialDateTimeId,
          status: availability.status,
        })),
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Availability', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateMemberAvailabilities.createNew',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result = { message: 'Availabilities updated successfully' };

    yield* Effect.logInfo('Member availabilities updated successfully', {
      userId,
      eventId,
      availabilityCount: availabilities.length,
      operation: 'update',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        if (err instanceof UnauthorizedError) {
          return [err, undefined] as const;
        }
        return [
          new DatabaseError({ message: 'Failed to update availabilities' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('availability'))
  );
};

/**
 * Choose date time for an event (organizer only)
 */
export const chooseDateTime = async (
  input: ChooseDateTimeParams
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | OperationError,
    { message: string }
  >
> => {
  const { eventId, potentialDateTimeId } = input;

  // Get auth outside Effect.gen
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Choosing date time for event', {
      eventId,
      userId,
      potentialDateTimeId,
    });

    // Check if user is the organizer
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: {
          eventId,
          personId: userId,
          role: 'ORGANIZER',
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'chooseDateTime.checkOrganizer',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!membership) {
      yield* Effect.logInfo('User not authorized to choose date', {
        userId,
        eventId,
        reason: 'not_organizer',
        operation: 'chooseDateTime',
      });
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Only organizers can choose the date',
        })
      );
      return;
    }

    // Get the potential date time
    const potentialDateTime = yield* Effect.promise(() =>
      db.potentialDateTime.findUnique({
        where: { id: potentialDateTimeId },
      })
    ).pipe(
      Effect.mapError((cause: Error) =>
        getPrismaError('PotentialDateTime', cause)
      ),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'chooseDateTime.fetchPDT',
          eventId,
          userId,
          potentialDateTimeId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!potentialDateTime) {
      yield* Effect.logInfo('Date selection failed', {
        userId,
        eventId,
        potentialDateTimeId,
        reason: 'pdt_not_found',
        operation: 'chooseDateTime',
      });
      yield* Effect.fail(
        new NotFoundError({
          message: 'Potential date time not found',
          cause: potentialDateTimeId,
        })
      );
      return;
    }

    // Update event with chosen date time
    yield* Effect.promise(() =>
      db.event.update({
        where: { id: eventId },
        data: { chosenDateTime: potentialDateTime.dateTime },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'chooseDateTime.updateEvent',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result = { message: 'Date time chosen successfully' };

    yield* Effect.logInfo('Event date time chosen successfully', {
      userId,
      eventId,
      potentialDateTimeId,
      chosenDateTime: potentialDateTime.dateTime,
      operation: 'update',
    });

    // Trigger DATE_CHOSEN notification for event members (fire-and-forget)
    yield* Effect.fork(
      createEventNotifications({
        eventId,
        type: 'DATE_CHOSEN',
        authorId: userId,
        datetime: potentialDateTime.dateTime,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create DATE_CHOSEN notifications', {
            eventId,
            authorId: userId,
            chosenDateTime: potentialDateTime.dateTime,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    );

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        if (err instanceof UnauthorizedError || err instanceof NotFoundError) {
          return [err, undefined] as const;
        }
        return [
          new OperationError({ message: 'Failed to choose date time' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('availability'))
  );
};

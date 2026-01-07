import { Effect, Schedule } from 'effect';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import { getUserId } from './auth-helpers';
import type { ResultTuple } from '@groupi/schema';
import {
  CreateEventParams,
  GetEventHeaderDataParams,
  GetEventNewPostPageDataParams,
  GetEventAttendeesPageDataParams,
  UpdateEventDetailsParams,
  DeleteEventParams,
  LeaveEventParams,
  GetMutualEventsParams,
} from '@groupi/schema/params';
import {
  EventHeaderData,
  EventDetailsData,
  EventNewPostPageData,
  EventAttendeesPageData,
  MutualEventsData,
} from '@groupi/schema/data';
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
// EVENT DOMAIN SERVICES
// ============================================================================

/**
 * Fetch event header data for event page header component
 */
export const getEventHeaderData = async ({
  eventId,
}: GetEventHeaderDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    EventHeaderData
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
    yield* Effect.logDebug('Fetching event header data', {
      eventId,
      userId,
    });

    const eventData = yield* Effect.promise(() =>
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
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getEventHeaderData',
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
      yield* Effect.logDebug('Event not found', {
        userId,
        eventId,
        operation: 'getEventHeaderData',
      });
      yield* Effect.fail(
        new NotFoundError({ message: `Event not found`, cause: eventId })
      );
      return;
    }

    if (eventData.memberships.length === 0) {
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to access this event',
        })
      );
      return;
    }

    const userMembership = eventData.memberships[0];

    // Direct construction - no factory needed
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

    yield* Effect.logDebug('Event header data fetched successfully', {
      eventId,
      userId,
    });

    return result;
  }).pipe(
    Effect.either,
    Effect.map(either =>
      either._tag === 'Left'
        ? ([
            either.left instanceof NotFoundError ||
            either.left instanceof UnauthorizedError
              ? either.left
              : new DatabaseError({
                  message: 'Failed to fetch event header data',
                  cause: either.left,
                }),
            undefined,
          ] as [DatabaseError | UnauthorizedError | NotFoundError, undefined])
        : ([null, either.right] as [null, EventHeaderData])
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

/**
 * Fetch event new post page data
 */
export const getEventNewPostPageData = async ({
  eventId,
}: GetEventNewPostPageDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    EventNewPostPageData
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
    yield* Effect.logDebug('Fetching event new post page data', {
      eventId,
      userId,
    });

    const eventData = yield* Effect.promise(() =>
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
            take: 1,
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getEventNewPostPageData',
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
      yield* Effect.logDebug('Event not found', {
        userId,
        eventId,
        operation: 'getEventNewPostPageData',
      });
      yield* Effect.fail(
        new NotFoundError({ message: `Event not found`, cause: eventId })
      );
      return;
    }

    if (eventData.memberships.length === 0) {
      yield* Effect.logDebug('User not authorized to access event', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'getEventNewPostPageData',
      });
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to access this event',
        })
      );
      return;
    }

    // Direct construction - no validation needed
    const result: EventNewPostPageData = {
      event: {
        id: eventData.id,
        title: eventData.title,
      },
      userRole: eventData.memberships[0].role,
    };

    yield* Effect.logDebug('Event new post page data fetched successfully', {
      eventId,
      userId,
    });

    return result;
  }).pipe(
    Effect.either,
    Effect.map(either =>
      either._tag === 'Left'
        ? ([
            either.left instanceof NotFoundError ||
            either.left instanceof UnauthorizedError
              ? either.left
              : new DatabaseError({
                  message: 'Failed to fetch event data',
                  cause: either.left,
                }),
            undefined,
          ] as [DatabaseError | UnauthorizedError | NotFoundError, undefined])
        : ([null, either.right] as [null, EventNewPostPageData])
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

/**
 * Fetch event attendees page data
 */
export const getEventAttendeesPageData = async ({
  eventId,
}: GetEventAttendeesPageDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    EventAttendeesPageData
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
    yield* Effect.logDebug('Fetching event attendees page data', {
      eventId,
      userId,
    });

    const eventData = yield* Effect.promise(() =>
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
                  user: {
                    select: {
                      name: true,
                      email: true,
                      image: true,
                      username: true,
                    },
                  },
                },
              },
              availabilities: {
                select: {
                  status: true,
                  membershipId: true,
                  potentialDateTimeId: true,
                  potentialDateTime: {
                    select: {
                      id: true,
                      eventId: true,
                      dateTime: true,
                    },
                  },
                },
              },
            },
            orderBy: [
              { role: 'desc' }, // ORGANIZER first
              { person: { user: { name: 'asc' } } },
            ],
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getEventAttendeesPageData',
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
      yield* Effect.logDebug('Event not found', {
        userId,
        eventId,
        operation: 'getEventAttendeesPageData',
      });
      yield* Effect.fail(
        new NotFoundError({ message: `Event not found`, cause: eventId })
      );
      return;
    }

    // Check if user is a member
    const userMembership = eventData.memberships.find(
      m => m.personId === userId
    );
    if (!userMembership) {
      yield* Effect.logDebug('User not authorized to access event', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'getEventAttendeesPageData',
      });
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to access this event',
        })
      );
      return;
    }

    // Direct construction
    const result: EventAttendeesPageData = {
      event: {
        id: eventData.id,
        title: eventData.title,
        chosenDateTime: eventData.chosenDateTime,
        memberships: eventData.memberships.map(membership => ({
          id: membership.id,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
          personId: membership.personId,
          eventId: membership.eventId,
          person: {
            id: membership.person.id,
            user: {
              name: membership.person.user?.name || null,
              email: membership.person.user?.email || '',
              image: membership.person.user?.image || null,
              username: membership.person.user?.username || null,
            },
          },
          availabilities: membership.availabilities.map(availability => ({
            status: availability.status,
            membershipId: availability.membershipId,
            potentialDateTimeId: availability.potentialDateTimeId,
            potentialDateTime: {
              id: availability.potentialDateTime.id,
              eventId: availability.potentialDateTime.eventId,
              dateTime: availability.potentialDateTime.dateTime,
            },
          })),
        })),
      },
      userMembership: {
        id: userMembership.id,
        role: userMembership.role,
        rsvpStatus: userMembership.rsvpStatus,
      },
      userId: userId,
    };

    yield* Effect.logDebug('Event attendees page data fetched successfully', {
      eventId,
      userId,
      memberCount: result.event.memberships.length,
    });

    return result;
  }).pipe(
    Effect.either,
    Effect.map(either =>
      either._tag === 'Left'
        ? ([
            either.left instanceof NotFoundError ||
            either.left instanceof UnauthorizedError
              ? either.left
              : new DatabaseError({
                  message: 'Failed to fetch event attendees data',
                  cause: either.left,
                }),
            undefined,
          ] as [DatabaseError | UnauthorizedError | NotFoundError, undefined])
        : ([null, either.right] as [null, EventAttendeesPageData])
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

/**
 * Create a new event
 */
export const createEvent = async ({
  title,
  description,
  location,
  potentialDateTimes,
}: CreateEventParams): Promise<
  ResultTuple<
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | OperationError
    | AuthenticationError,
    EventDetailsData
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
    yield* Effect.logDebug('Creating new event', {
      userId,
      title,
      potentialDateTimesCount: potentialDateTimes.length,
    });

    // Create event with organizer membership
    const event = yield* Effect.promise(() =>
      db.event.create({
        data: {
          title,
          description: description || '',
          location: location || '',
          memberships: {
            create: {
              personId: userId,
              role: 'ORGANIZER',
              rsvpStatus: 'YES',
            },
          },
          potentialDateTimes: {
            create: potentialDateTimes.map(dateTime => ({
              dateTime: new Date(dateTime),
            })),
          },
        },
        include: {
          memberships: {
            include: {
              person: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                      image: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
          potentialDateTimes: {
            select: {
              id: true,
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createEvent',
          userId,
          title,
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

    // Create availability records for organizer (all YES)
    const organizerMembership = event.memberships[0];
    if (organizerMembership && event.potentialDateTimes.length > 0) {
      yield* Effect.promise(() =>
        db.availability.createMany({
          data: event.potentialDateTimes.map(pdt => ({
            membershipId: organizerMembership.id,
            potentialDateTimeId: pdt.id,
            status: 'YES',
          })),
        })
      ).pipe(
        Effect.mapError((cause: Error) =>
          getPrismaError('Availability', cause)
        ),
        Effect.tapError(error =>
          Effect.logError('Database operation encountered error', {
            operation: 'createEvent.createAvailabilities',
            userId,
            eventId: event.id,
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
    }

    // Direct construction
    const result: EventDetailsData = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
      },
      userMembership: {
        id: event.memberships[0].id,
        role: event.memberships[0].role,
        rsvpStatus: event.memberships[0].rsvpStatus,
      },
      memberships: event.memberships.map(membership => ({
        id: membership.id,
        personId: membership.personId,
        eventId: membership.eventId,
        role: membership.role,
        rsvpStatus: membership.rsvpStatus,
        person: {
          id: membership.person.id,
          user: {
            name: membership.person.user?.name || null,
            email: membership.person.user?.email || '',
            image: membership.person.user?.image || null,
            username: membership.person.user?.username || null,
          },
        },
      })),
    };

    yield* Effect.logInfo('Event created successfully', {
      userId, // Who performed the action
      eventId: event.id,
      title,
      membershipId: event.memberships[0].id,
      operation: 'create',
    });

    return result;
  }).pipe(
    Effect.catchTags({
      DatabaseError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to create event' }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to create event' }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to create event' }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to create event' }),
          undefined,
        ] as const),
      OperationError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to create event' }),
          undefined,
        ] as const),
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, EventDetailsData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

/**
 * Update event details
 */
export const updateEventDetails = async ({
  eventId,
  title,
  description,
  location,
}: UpdateEventDetailsParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | AuthenticationError,
    EventDetailsData
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
    yield* Effect.logDebug('Updating event details', {
      eventId,
      userId,
      title,
    });

    // Check if user is authorized to update
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: {
          eventId,
          personId: userId,
          role: { in: ['ORGANIZER', 'MODERATOR'] },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateEventDetails.checkPermissions',
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
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to update this event',
        })
      );
      return;
    }

    const event = yield* Effect.promise(() =>
      db.event.update({
        where: { id: eventId },
        data: {
          title,
          description,
          location,
        },
        include: {
          memberships: {
            include: {
              person: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                      image: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateEventDetails.updateEvent',
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

    // Find user's membership for the result
    const userMembership = event.memberships.find(m => m.personId === userId);
    if (!userMembership) {
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to access this event',
        })
      );
      return;
    }

    // Direct construction
    const result: EventDetailsData = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
      },
      userMembership: {
        id: userMembership.id,
        role: userMembership.role,
        rsvpStatus: userMembership.rsvpStatus,
      },
      memberships: event.memberships.map(membership => ({
        id: membership.id,
        personId: membership.personId,
        eventId: membership.eventId,
        role: membership.role,
        rsvpStatus: membership.rsvpStatus,
        person: {
          id: membership.person.id,
          user: {
            name: membership.person.user?.name || null,
            email: membership.person.user?.email || '',
            image: membership.person.user?.image || null,
            username: membership.person.user?.username || null,
          },
        },
      })),
    };

    yield* Effect.logInfo('Event details updated successfully', {
      userId, // Who performed the action
      eventId: event.id,
      title,
      operation: 'update',
    });

    // Trigger EVENT_EDITED notification for event members (fire-and-forget)
    // Run outside Effect.gen to ensure it executes with proper context
    Effect.runPromise(
      createEventNotifications({
        eventId,
        type: 'EVENT_EDITED',
        authorId: userId,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create EVENT_EDITED notifications', {
            eventId,
            authorId: userId,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    ).catch(() => {
      // Ignore errors - fire-and-forget
    });

    return result;
  }).pipe(
    Effect.catchTags({
      UnauthorizedError: error => Effect.succeed([error, undefined] as const),
      DatabaseError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to update event details' }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to update event details' }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to update event details' }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to update event details' }),
          undefined,
        ] as const),
      NotFoundError: error => Effect.succeed([error, undefined] as const),
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, EventDetailsData])
  );

  const result = await Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );

  // Trigger EVENT_EDITED notification for event members (fire-and-forget)
  // Run after main Effect completes to avoid blocking or causing issues
  if (!result[0] && result[1]) {
    Effect.runPromise(
      createEventNotifications({
        eventId: eventId,
        type: 'EVENT_EDITED',
        authorId: userId,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create EVENT_EDITED notifications', {
            eventId: eventId,
            authorId: userId,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    ).catch(() => {
      // Ignore errors - fire-and-forget
    });
  }

  return result;
};

/**
 * Delete an event
 */
export const deleteEvent = async ({
  eventId,
}: DeleteEventParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | OperationError
    | AuthenticationError,
    { message: string }
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
    yield* Effect.logDebug('Deleting event', {
      eventId,
      userId,
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
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteEvent.checkOrganizer',
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
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Only organizers can delete events',
        })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.event.delete({
        where: { id: eventId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteEvent.deleteEvent',
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

    const result = { message: 'Event deleted successfully' };

    yield* Effect.logInfo('Event deleted successfully', {
      userId, // Who performed the action
      eventId,
      operation: 'delete',
    });

    return result;
  }).pipe(
    Effect.catchTags({
      UnauthorizedError: error => Effect.succeed([error, undefined] as const),
      DatabaseError: _error =>
        Effect.succeed([
          new OperationError({ message: 'Failed to delete event' }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new OperationError({ message: 'Failed to delete event' }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new OperationError({ message: 'Failed to delete event' }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new OperationError({ message: 'Failed to delete event' }),
          undefined,
        ] as const),
      OperationError: error => Effect.succeed([error, undefined] as const),
      NotFoundError: error => Effect.succeed([error, undefined] as const),
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

/**
 * Leave an event (remove membership)
 */
export const leaveEvent = async ({
  eventId,
}: LeaveEventParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | OperationError
    | AuthenticationError,
    { message: string; membershipId: string }
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
    yield* Effect.logDebug('Leaving event', {
      eventId,
      userId,
    });

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
          operation: 'leaveEvent.findMembership',
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
      yield* Effect.logDebug('User not authorized to leave event', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'leaveEvent',
      });
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Not authorized to access this event',
        })
      );
      return;
    }

    // Organizers cannot leave their own event
    if (membership.role === 'ORGANIZER') {
      yield* Effect.logDebug('Organizer attempted to leave own event', {
        userId,
        eventId,
        membershipId: membership.id,
        operation: 'leaveEvent',
      });
      yield* Effect.fail(
        new UnauthorizedError({
          message: 'Organizers cannot leave their own event',
        })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.membership.delete({
        where: { id: membership.id },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'leaveEvent.deleteMembership',
          eventId,
          userId,
          membershipId: membership.id,
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

    const result = {
      message: 'Left event successfully',
      membershipId: membership.id,
    };

    yield* Effect.logInfo('User left event successfully', {
      userId, // Who performed the action
      eventId,
      membershipId: membership.id,
      operation: 'delete',
    });

    // Trigger USER_LEFT notification for event members (fire-and-forget)
    // Run outside Effect.gen to ensure it executes with proper context
    Effect.runPromise(
      createEventNotifications({
        eventId,
        type: 'USER_LEFT',
        authorId: userId,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create USER_LEFT notifications', {
            eventId,
            authorId: userId,
            membershipId: membership.id,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    ).catch(() => {
      // Ignore errors - fire-and-forget
    });

    return result;
  }).pipe(
    Effect.catchTags({
      UnauthorizedError: error => Effect.succeed([error, undefined] as const),
      DatabaseError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to leave event' }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to leave event' }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to leave event' }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to leave event' }),
          undefined,
        ] as const),
      OperationError: error => Effect.succeed([error, undefined] as const),
      NotFoundError: error => Effect.succeed([error, undefined] as const),
    }),
    // Map result to tuple
    Effect.map(
      result =>
        [null, result] as [null, { message: string; membershipId: string }]
    )
  );

  const result = await Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );

  // Trigger USER_LEFT notification for event members (fire-and-forget)
  // Run after main Effect completes to avoid blocking or causing issues
  if (!result[0] && result[1]) {
    Effect.runPromise(
      createEventNotifications({
        eventId: eventId,
        type: 'USER_LEFT',
        authorId: userId,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create USER_LEFT notifications', {
            eventId,
            authorId: userId,
            membershipId: result[1].membershipId,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    ).catch(() => {
      // Ignore errors - fire-and-forget
    });
  }

  return result;
};

/**
 * Fetch mutual events between current user and another user
 */
export const fetchMutualEvents = async ({
  otherUserId,
}: GetMutualEventsParams): Promise<
  ResultTuple<
    NotFoundError | AuthenticationError | DatabaseError | ConnectionError,
    MutualEventsData
  >
> => {
  // Get auth outside Effect.gen
  const [authError, currentUserId] = await getUserId();
  if (authError || !currentUserId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching mutual events', {
      currentUserId,
      otherUserId,
    });

    // Find events where both users have memberships
    const currentUserMemberships = yield* Effect.promise(() =>
      db.membership.findMany({
        where: { personId: currentUserId },
        select: {
          eventId: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchMutualEvents.findCurrentUserMemberships',
          currentUserId,
          otherUserId,
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

    const currentUserEventIds = currentUserMemberships.map(m => m.eventId);

    if (currentUserEventIds.length === 0) {
      // No events for current user, so no mutual events
      return [] as MutualEventsData;
    }

    // Find events where other user also has membership
    const mutualEvents = yield* Effect.promise(() =>
      db.event.findMany({
        where: {
          id: { in: currentUserEventIds },
          memberships: {
            some: {
              personId: otherUserId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          chosenDateTime: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchMutualEvents.findMutualEvents',
          currentUserId,
          otherUserId,
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

    yield* Effect.logDebug('Mutual events fetched successfully', {
      currentUserId,
      otherUserId,
      mutualEventCount: mutualEvents.length,
    });

    return mutualEvents as MutualEventsData;
  }).pipe(
    Effect.either,
    Effect.map(either =>
      either._tag === 'Left'
        ? ([
            either.left instanceof NotFoundError
              ? either.left
              : new DatabaseError({
                  message: 'Failed to fetch mutual events',
                  cause: either.left,
                }),
            undefined,
          ] as [DatabaseError | NotFoundError, undefined])
        : ([null, either.right] as [null, MutualEventsData])
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

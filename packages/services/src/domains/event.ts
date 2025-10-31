import { Effect, Schedule } from 'effect';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import { getCurrentUserId } from './auth';
import type { ResultTuple } from '@groupi/schema';
import {
  CreateEventParams,
  GetEventHeaderDataParams,
  GetEventNewPostPageDataParams,
  GetEventAttendeesPageDataParams,
  UpdateEventDetailsParams,
  DeleteEventParams,
  LeaveEventParams,
} from '@groupi/schema/params';
import {
  EventHeaderData,
  EventDetailsData,
  EventNewPostPageData,
  EventAttendeesPageData,
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
  const [authError, userId] = await getCurrentUserId();
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
      yield* Effect.logInfo('Event not found', {
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
    Effect.catchTags({
      NotFoundError: error => Effect.succeed([error, undefined] as const),
      UnauthorizedError: error => Effect.succeed([error, undefined] as const),
      DatabaseError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event header data' }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event header data' }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event header data' }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event header data' }),
          undefined,
        ] as const),
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, EventHeaderData])
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
  const [authError, userId] = await getCurrentUserId();
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
      yield* Effect.logInfo('Event not found', {
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
      yield* Effect.logInfo('User not authorized to access event', {
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
    Effect.catchTags({
      NotFoundError: error => Effect.succeed([error, undefined] as const),
      UnauthorizedError: error => Effect.succeed([error, undefined] as const),
      DatabaseError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event data' }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event data' }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event data' }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new DatabaseError({ message: 'Failed to fetch event data' }),
          undefined,
        ] as const),
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, EventNewPostPageData])
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
  const [authError, userId] = await getCurrentUserId();
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
      yield* Effect.logInfo('Event not found', {
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
      yield* Effect.logInfo('User not authorized to access event', {
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
            },
          },
        })),
      },
    };

    yield* Effect.logDebug('Event attendees page data fetched successfully', {
      eventId,
      userId,
      memberCount: result.event.memberships.length,
    });

    return result;
  }).pipe(
    Effect.catchTags({
      NotFoundError: error => Effect.succeed([error, undefined] as const),
      UnauthorizedError: error => Effect.succeed([error, undefined] as const),
      DatabaseError: _error =>
        Effect.succeed([
          new DatabaseError({
            message: 'Failed to fetch event attendees data',
          }),
          undefined,
        ] as const),
      ConnectionError: _error =>
        Effect.succeed([
          new DatabaseError({
            message: 'Failed to fetch event attendees data',
          }),
          undefined,
        ] as const),
      ConstraintError: _error =>
        Effect.succeed([
          new DatabaseError({
            message: 'Failed to fetch event attendees data',
          }),
          undefined,
        ] as const),
      ValidationError: _error =>
        Effect.succeed([
          new DatabaseError({
            message: 'Failed to fetch event attendees data',
          }),
          undefined,
        ] as const),
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, EventAttendeesPageData])
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
  const [authError, userId] = await getCurrentUserId();
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
  const [authError, userId] = await getCurrentUserId();
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
    yield* Effect.fork(
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
    );

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

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
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
  const [authError, userId] = await getCurrentUserId();
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
    { message: string }
  >
> => {
  // Get auth outside Effect.gen
  const [authError, userId] = await getCurrentUserId();
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
      yield* Effect.logInfo('User not authorized to leave event', {
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
      yield* Effect.logInfo('Organizer attempted to leave own event', {
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

    const result = { message: 'Left event successfully' };

    yield* Effect.logInfo('User left event successfully', {
      userId, // Who performed the action
      eventId,
      membershipId: membership.id,
      operation: 'delete',
    });

    // Trigger USER_LEFT notification for event members (fire-and-forget)
    yield* Effect.fork(
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
    );

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
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('events'))
  );
};

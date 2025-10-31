import { Effect, Schedule } from 'effect';
import { getCurrentUserId } from './auth';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetInvitePageDataParams,
  GetEventInvitePageDataParams,
  CreateInviteParams,
  DeleteInviteParams,
  AcceptInviteParams,
} from '@groupi/schema/params';
import {
  EventInviteData,
  InvitePageData,
  EventInvitePageData,
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
// INVITE DOMAIN SERVICES
// ============================================================================

/**
 * Fetch individual invite data for invite acceptance page
 */
export const fetchInvitePageData = async ({
  inviteId,
}: GetInvitePageDataParams): Promise<
  ResultTuple<
    NotFoundError | ValidationError | DatabaseError | ConnectionError,
    InvitePageData
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching invite page data', {
      inviteId,
    });

    const inviteData = yield* Effect.promise(() =>
      db.invite.findUnique({
        where: { id: inviteId },
        select: {
          id: true,
          name: true,
          eventId: true,
          createdById: true,
          expiresAt: true,
          usesRemaining: true,
          maxUses: true,
          createdAt: true,
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              chosenDateTime: true,
              _count: {
                select: { memberships: true },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
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
      Effect.mapError((cause: Error) => getPrismaError('Invite', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchInvitePageData',
          inviteId,
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

    if (!inviteData) {
      yield* Effect.fail(
        new NotFoundError({ message: `Invite not found`, cause: inviteId })
      );
      return;
    }

    // Check if invite is expired
    if (inviteData.expiresAt && inviteData.expiresAt < new Date()) {
      yield* Effect.fail(
        new ValidationError({ message: 'Invite has expired' })
      );
      return;
    }

    // Check if invite has uses remaining
    if (
      inviteData.maxUses &&
      inviteData.usesRemaining !== null &&
      inviteData.usesRemaining <= 0
    ) {
      yield* Effect.fail(
        new ValidationError({ message: 'Invite has no remaining uses' })
      );
      return;
    }

    // Direct construction
    const result: InvitePageData = {
      id: inviteData.id,
      name: inviteData.name,
      eventId: inviteData.eventId,
      createdById: inviteData.createdById,
      expiresAt:
        inviteData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usesRemaining: inviteData.usesRemaining,
      maxUses: inviteData.maxUses,
      createdAt: inviteData.createdAt,
      createdBy: {
        id: inviteData.createdBy.id,
        person: {
          id: inviteData.createdBy.person.id,
          user: {
            name: inviteData.createdBy.person.user.name,
            email: inviteData.createdBy.person.user.email,
            image: inviteData.createdBy.person.user.image,
          },
        },
      },
      event: {
        id: inviteData.event.id,
        title: inviteData.event.title,
        description: inviteData.event.description,
        location: inviteData.event.location,
        chosenDateTime: inviteData.event.chosenDateTime,
        memberCount: inviteData.event._count.memberships,
      },
    };

    yield* Effect.logDebug('Invite page data fetched successfully', {
      inviteId,
      eventId: result.eventId,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logInfo('Invite not found', {
            inviteId,
            operation: 'fetchInvitePageData',
          });
          return [err, undefined] as const;
        }

        if (err instanceof ValidationError && err.message.includes('expired')) {
          yield* Effect.logInfo('Invite expired', {
            inviteId,
            operation: 'fetchInvitePageData',
          });
          return [err, undefined] as const;
        }

        if (
          err instanceof ValidationError &&
          err.message.includes('no remaining uses')
        ) {
          yield* Effect.logInfo('Invite has no uses remaining', {
            inviteId,
            operation: 'fetchInvitePageData',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError({ message: 'Failed to fetch invite data' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, InvitePageData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('invites'))
  );
};

/**
 * Fetch event invite management data
 */
export const getEventInvitePageData = async ({
  eventId,
}: GetEventInvitePageDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | AuthenticationError,
    EventInvitePageData
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching event invite page data', {
      eventId,
      userId,
    });

    const eventData = yield* Effect.promise(() =>
      db.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          chosenDateTime: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            where: { personId: userId },
            select: { role: true },
            take: 1,
          },
          invites: {
            select: {
              id: true,
              name: true,
              eventId: true,
              createdById: true,
              expiresAt: true,
              usesRemaining: true,
              maxUses: true,
              createdAt: true,
              createdBy: {
                select: {
                  id: true,
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
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getEventInvitePageData',
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
      return [
        new NotFoundError({ message: `Event not found`, cause: eventId }),
        undefined,
      ];
    }

    // Check if user has permission to manage invites
    const userMembership = eventData.memberships[0];
    if (
      !userMembership ||
      !['ORGANIZER', 'MODERATOR'].includes(userMembership.role)
    ) {
      return [
        new UnauthorizedError({ message: 'Not authorized to manage invites' }),
        undefined,
      ];
    }

    // Direct construction
    const result: EventInvitePageData = {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      chosenDateTime: eventData.chosenDateTime,
      createdAt: eventData.createdAt,
      updatedAt: eventData.updatedAt,
      invites: eventData.invites.map(invite => ({
        id: invite.id,
        name: invite.name,
        eventId: invite.eventId,
        createdById: invite.createdById,
        expiresAt:
          invite.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usesRemaining: invite.usesRemaining,
        maxUses: invite.maxUses,
        createdAt: invite.createdAt,
        createdBy: {
          id: invite.createdBy.id,
          person: {
            id: invite.createdBy.person.id,
            user: {
              name: invite.createdBy.person.user.name,
              email: invite.createdBy.person.user.email,
              image: invite.createdBy.person.user.image,
            },
          },
        },
      })),
      memberships: [], // Will be populated separately if needed
    };

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        switch (err.constructor.name) {
          case 'NotFoundError':
          case 'UnauthorizedError':
            return [err, undefined] as const;
          default:
            return [
              new DatabaseError({
                message: 'Failed to fetch event invite data',
              }),
              undefined,
            ] as const;
        }
      });
    }),
    Effect.map(result => [null, result] as [null, EventInvitePageData])
  );

  return Effect.runPromise(effect);
};

/**
 * Create a new invite
 */
export const createInvite = async (
  inviteData: CreateInviteParams
): Promise<
  ResultTuple<
    | UnauthorizedError
    | OperationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | AuthenticationError,
    EventInviteData
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const { eventId, name, maxUses, expiresAt } = inviteData;
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating invite', {
      eventId,
      userId,
      name,
    });

    // Check if user can create invites for this event
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: {
          eventId,
          personId: userId,
          role: { in: ['ORGANIZER', 'MODERATOR'] },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createInvite.checkPermissions',
          eventId: inviteData.eventId,
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
        new UnauthorizedError({ message: 'Not authorized to create invites' })
      );
      return;
    }

    const invite = yield* Effect.promise(() =>
      db.invite.create({
        data: {
          eventId,
          createdById: membership.id,
          name,
          maxUses,
          expiresAt,
          usesRemaining: maxUses,
        },
        select: {
          id: true,
          name: true,
          eventId: true,
          createdById: true,
          expiresAt: true,
          usesRemaining: true,
          maxUses: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
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
      Effect.mapError((cause: Error) => getPrismaError('Invite', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createInvite.createInvite',
          eventId: inviteData.eventId,
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

    const result: EventInviteData = {
      id: invite.id,
      name: invite.name,
      eventId: invite.eventId,
      createdById: invite.createdById,
      expiresAt:
        invite.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usesRemaining: invite.usesRemaining,
      maxUses: invite.maxUses,
      createdAt: invite.createdAt,
      createdBy: {
        id: invite.createdBy.id,
        person: {
          id: invite.createdBy.person.id,
          user: {
            name: invite.createdBy.person.user.name,
            email: invite.createdBy.person.user.email,
            image: invite.createdBy.person.user.image,
          },
        },
      },
    };

    yield* Effect.logInfo('Invite created successfully', {
      userId, // Who performed the action
      inviteId: invite.id,
      eventId: inviteData.eventId,
      name: inviteData.name,
      operation: 'create',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to create invite', {
            userId,
            eventId,
            reason: 'insufficient_permissions',
            operation: 'createInvite',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return InviteCreationError
        return [
          new OperationError({ message: 'Failed to create invite' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, EventInviteData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('invites'))
  );
};

/**
 * Delete an invite
 */
export const deleteInvite = async ({
  inviteId,
}: DeleteInviteParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | OperationError
    | DatabaseError
    | ConnectionError
    | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting invite', {
      inviteId,
      userId,
    });

    // Check if invite exists and user can delete it
    const invite = yield* Effect.promise(() =>
      db.invite.findUnique({
        where: { id: inviteId },
        include: {
          createdBy: {
            include: {
              event: {
                include: {
                  memberships: {
                    where: { personId: userId },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Invite', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'deleteInvite.fetchInvite',
              inviteId,
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

    if (!invite) {
      yield* Effect.fail(
        new NotFoundError({ message: `Invite not found`, cause: inviteId })
      );
      return;
    }

    const userMembership = invite.createdBy.event.memberships[0];
    if (
      !userMembership ||
      !['ORGANIZER', 'MODERATOR'].includes(userMembership.role)
    ) {
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not authorized to delete invites' })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.invite.delete({
        where: { id: inviteId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Invite', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'deleteInvite.deleteInvite',
              inviteId,
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

    const result = { message: 'Invite deleted successfully' };

    yield* Effect.logInfo('Invite deleted successfully', {
      userId,
      inviteId,
      operation: 'delete',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        switch (err.constructor.name) {
          case 'NotFoundError':
            yield* Effect.logInfo('Invite not found for deletion', {
              userId,
              inviteId,
              operation: 'deleteInvite',
            });
            return [err, undefined] as const;
          case 'UnauthorizedError':
            yield* Effect.logInfo('User not authorized to delete invite', {
              userId,
              inviteId,
              reason: 'insufficient_permissions',
              operation: 'deleteInvite',
            });
            return [err, undefined] as const;
          case 'ConnectionError':
            yield* Effect.logError('Connection error deleting invite', {
              userId,
              inviteId,
              operation: 'deleteInvite',
            });
            return [err, undefined] as const;
          case 'DatabaseError':
            yield* Effect.logError('Database error deleting invite', {
              userId,
              inviteId,
              operation: 'deleteInvite',
            });
            return [err, undefined] as const;
          default:
            yield* Effect.logError('Unexpected error deleting invite', {
              userId,
              inviteId,
              operation: 'deleteInvite',
              errorType: err.constructor.name,
            });
            return [
              new OperationError({ message: 'Failed to delete invite' }),
              undefined,
            ] as const;
        }
      });
    }),
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('invites'))
  );
};

/**
 * Accept an invite (join event)
 */
export const acceptInvite = async ({
  inviteId,
}: AcceptInviteParams): Promise<
  ResultTuple<
    | NotFoundError
    | ValidationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | AuthenticationError,
    { message: string; membershipId: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Accepting invite', {
      inviteId,
      personId: userId,
    });

    // Check if invite exists and is valid
    const invite = yield* Effect.promise(() =>
      db.invite.findUnique({
        where: { id: inviteId },
        include: {
          event: {
            include: {
              memberships: {
                where: { personId: userId },
                take: 1,
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Invite', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'acceptInvite.fetchInvite',
              inviteId,
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

    if (!invite) {
      yield* Effect.fail(
        new NotFoundError({ message: `Invite not found`, cause: inviteId })
      );
      return;
    }

    // Check if invite is expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      yield* Effect.fail(
        new ValidationError({ message: 'Invite has expired' })
      );
      return;
    }

    // Check if invite has uses remaining
    if (
      invite.maxUses &&
      invite.usesRemaining !== null &&
      invite.usesRemaining <= 0
    ) {
      yield* Effect.fail(
        new ValidationError({ message: 'Invite has no remaining uses' })
      );
      return;
    }

    // Check if user is already a member
    if (invite.event.memberships.length > 0) {
      return {
        message: 'Already a member of this event',
        membershipId: invite.event.memberships[0].id,
      };
    }

    // Create membership
    const membership = yield* Effect.promise(() =>
      db.membership.create({
        data: {
          personId: userId,
          eventId: invite.eventId,
          role: 'ATTENDEE',
          rsvpStatus: 'PENDING',
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'acceptInvite.createMembership',
              inviteId,
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

    // Update invite usage if needed
    if (invite.maxUses && invite.usesRemaining !== null) {
      yield* Effect.promise(() =>
        db.invite.update({
          where: { id: inviteId },
          data: { usesRemaining: (invite.usesRemaining || 0) - 1 },
        })
      ).pipe(
        Effect.mapError((cause: Error) => getPrismaError('Invite', cause)),
        Effect.tapError(error =>
          error instanceof ConnectionError
            ? Effect.logWarning('Database connection issue encountered', {
                operation: 'acceptInvite.updateInviteUsage',
                inviteId,
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
    }

    const result = {
      message: 'Successfully joined event',
      membershipId: membership.id,
    };

    yield* Effect.logInfo('Invite accepted successfully', {
      userId,
      inviteId,
      membershipId: membership.id,
      operation: 'accept',
    });

    // Trigger USER_JOINED notification for event members (fire-and-forget)
    yield* Effect.fork(
      createEventNotifications({
        eventId: invite.eventId,
        type: 'USER_JOINED',
        authorId: userId,
      }).pipe(
        Effect.catchAll(error => {
          return Effect.gen(function* () {
            yield* Effect.void;
            switch (error.constructor.name) {
              case 'ConnectionError':
                yield* Effect.logWarning(
                  'Notification service connection issue',
                  {
                    eventId: invite.eventId,
                    authorId: userId,
                    notificationType: 'USER_JOINED',
                    membershipId: membership.id,
                    error: error.message,
                  }
                );
                break;
              case 'NotFoundError':
                yield* Effect.logInfo(
                  'Event not found for USER_JOINED notification',
                  {
                    eventId: invite.eventId,
                    authorId: userId,
                    notificationType: 'USER_JOINED',
                  }
                );
                break;
              default:
                yield* Effect.logError(
                  'Unexpected error creating USER_JOINED notifications',
                  {
                    eventId: invite.eventId,
                    authorId: userId,
                    notificationType: 'USER_JOINED',
                    error: error.message,
                    errorType: error.constructor.name,
                  }
                );
            }
            return { message: 'User joined notification attempt completed' };
          });
        })
      )
    );

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        switch (err.constructor.name) {
          case 'NotFoundError':
            yield* Effect.logInfo('Invite not found for acceptance', {
              userId,
              inviteId,
              operation: 'acceptInvite',
            });
            return [err, undefined] as const;
          case 'ValidationError':
            yield* Effect.logInfo('Invite validation failed', {
              userId,
              inviteId,
              reason: err.message,
              operation: 'acceptInvite',
            });
            return [err, undefined] as const;
          case 'ConnectionError':
            yield* Effect.logError('Connection error accepting invite', {
              userId,
              inviteId,
              operation: 'acceptInvite',
            });
            return [err, undefined] as const;
          case 'ConstraintError':
            yield* Effect.logInfo(
              'Database constraint violation accepting invite',
              {
                userId,
                inviteId,
                operation: 'acceptInvite',
              }
            );
            return [err, undefined] as const;
          case 'DatabaseError':
            yield* Effect.logError('Database error accepting invite', {
              userId,
              inviteId,
              operation: 'acceptInvite',
            });
            return [err, undefined] as const;
          default:
            yield* Effect.logError('Unexpected error accepting invite', {
              userId,
              inviteId,
              operation: 'acceptInvite',
              errorType: err.constructor.name,
            });
            return [
              new OperationError({ message: 'Failed to accept invite' }),
              undefined,
            ] as const;
        }
      });
    }),
    Effect.map(
      result =>
        [null, result] as [null, { message: string; membershipId: string }]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('invites'))
  );
};

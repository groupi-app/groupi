import { Effect, Schedule } from 'effect';
import { auth } from '@clerk/nextjs/server';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetMemberListDataParams,
  UpdateMemberRSVPParams,
  UpdateMemberRoleParams,
  RemoveMemberFromEventParams,
} from '@groupi/schema/params';
import { MembershipDTO, MemberListPageDTO } from '@groupi/schema/data';
import {
  NotFoundError,
  UnauthorizedError,
  AuthenticationError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
  OperationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { createEventNotifications } from './notification';

// ============================================================================
// MEMBERSHIP DOMAIN SERVICES
// ============================================================================

/**
 * Fetch member list data for event attendees page
 */
export const getMemberListData = async ({
  eventId,
}: GetMemberListDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    MemberListPageDTO
  >
> => {
  const effect = Effect.gen(function* () {
    const { userId } = yield* Effect.promise(() => auth());
    if (!userId) {
      return [new AuthenticationError('Not authenticated'), undefined] as const;
    }
    yield* Effect.logDebug('Fetching member list data', {
      eventId,
      userId,
    });

    // Database operation with retry
    const eventData = yield* Effect.promise(() =>
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
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getMemberListData',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!eventData) {
      yield* Effect.logInfo('Event not found', {
        userId,
        eventId,
        operation: 'getMemberListData',
      });
      yield* Effect.fail(new NotFoundError(`Event not found`, eventId));
      return;
    }

    // Find user's membership
    const userMembership = eventData.memberships.find(
      m => m.person.id === userId
    );
    if (!userMembership) {
      yield* Effect.logInfo('User not authorized to view member list', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'getMemberListData',
      });
      yield* Effect.fail(
        new UnauthorizedError('Not authorized to view this event')
      );
      return;
    }

    // Direct construction
    const result: MemberListPageDTO = {
      event: {
        id: eventData.id,
        chosenDateTime: eventData.chosenDateTime,
        memberships: eventData.memberships.map(membership => ({
          id: membership.id,
          personId: membership.person.id,
          eventId: eventId,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
          person: {
            id: membership.person.id,
            firstName: membership.person.firstName,
            lastName: membership.person.lastName,
            username: membership.person.username,
            imageUrl: membership.person.imageUrl,
          },
        })),
      },
      userMembership: {
        id: userMembership.id,
        role: userMembership.role,
      },
      userId: userId,
    };

    yield* Effect.logDebug('Member list data fetched successfully', {
      eventId,
      userId,
      memberCount: result.event.memberships.length,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        if (err instanceof NotFoundError || err instanceof UnauthorizedError) {
          return [err, undefined] as const;
        }
        return [
          new DatabaseError('Failed to fetch member list data'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, MemberListPageDTO])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('memberships'))
  );
};

/**
 * Update member RSVP status
 */
export const updateMemberRSVP = async ({
  eventId,
  rsvpStatus,
}: UpdateMemberRSVPParams): Promise<
  ResultTuple<
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    MembershipDTO
  >
> => {
  const effect = Effect.gen(function* () {
    const { userId } = yield* Effect.promise(() => auth());
    if (!userId) {
      return [new AuthenticationError('Not authenticated'), undefined] as const;
    }
    yield* Effect.logDebug('Updating member RSVP status', {
      eventId,
      userId,
      rsvpStatus,
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
          operation: 'updateMemberRSVP.findMembership',
          eventId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!membership) {
      yield* Effect.fail(
        new UnauthorizedError('Not authorized to update member RSVP')
      );
      return;
    }

    const updatedMembership = yield* Effect.promise(() =>
      db.membership.update({
        where: { id: membership.id },
        data: { rsvpStatus },
        select: {
          id: true,
          personId: true,
          eventId: true,
          role: true,
          rsvpStatus: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateMemberRSVP.updateMembership',
          eventId,
          userId,
          membershipId: membership.id,
          rsvpStatus,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    // Direct construction
    const result: MembershipDTO = {
      id: updatedMembership.id,
      personId: updatedMembership.personId,
      eventId: updatedMembership.eventId,
      role: updatedMembership.role,
      rsvpStatus: updatedMembership.rsvpStatus,
    };

    yield* Effect.logInfo('Member RSVP status updated successfully', {
      userId, // Who performed the action
      membershipId: membership.id,
      eventId,
      rsvpStatus,
      operation: 'update',
    });

    // Trigger USER_RSVP notification for event members (fire-and-forget)
    yield* Effect.fork(
      createEventNotifications({
        eventId,
        type: 'USER_RSVP',
        authorId: userId,
        rsvp: rsvpStatus,
      }).pipe(
        Effect.catchAll(error => {
          return Effect.gen(function* () {
            yield* Effect.void;
            switch (error.constructor.name) {
              case 'ConnectionError':
                yield* Effect.logWarning(
                  'Notification service connection issue',
                  {
                    eventId,
                    authorId: userId,
                    notificationType: 'USER_RSVP',
                    rsvpStatus,
                    error: error.message,
                  }
                );
                break;
              case 'NotFoundError':
                yield* Effect.logInfo('Event not found for RSVP notification', {
                  eventId,
                  authorId: userId,
                  notificationType: 'USER_RSVP',
                });
                break;
              default:
                yield* Effect.logError(
                  'Unexpected error creating RSVP notifications',
                  {
                    eventId,
                    authorId: userId,
                    notificationType: 'USER_RSVP',
                    error: error.message,
                    errorType: error.constructor.name,
                  }
                );
            }
            return { message: 'RSVP notification attempt completed' };
          });
        })
      )
    );

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
          new DatabaseError('Failed to update RSVP status'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, MembershipDTO])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('memberships'))
  );
};

/**
 * Update member role (organizer/moderator only)
 */
export const updateMemberRole = async ({
  membershipId,
  role,
}: UpdateMemberRoleParams): Promise<
  ResultTuple<
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | AuthenticationError,
    MembershipDTO
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating member role', {
      membershipId,
      newRole: role,
      userId,
    });

    // Check if current user can update roles
    const targetMembership = yield* Effect.promise(() =>
      db.membership.findUnique({
        where: { id: membershipId },
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
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateMemberRole.findTarget',
          membershipId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!targetMembership) {
      yield* Effect.fail(
        new UnauthorizedError('Not authorized to update member roles')
      );
      return;
    }

    const userMembership = targetMembership.event.memberships[0];
    if (
      !userMembership ||
      !['ORGANIZER', 'MODERATOR'].includes(userMembership.role)
    ) {
      yield* Effect.fail(
        new UnauthorizedError('Not authorized to update member roles')
      );
      return;
    }

    const updatedMembership = yield* Effect.promise(() =>
      db.membership.update({
        where: { id: membershipId },
        data: { role },
        select: {
          id: true,
          personId: true,
          eventId: true,
          role: true,
          rsvpStatus: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateMemberRole.updateMembership',
          membershipId,
          userId,
          newRole: role,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    // Direct construction
    const result: MembershipDTO = {
      id: updatedMembership.id,
      personId: updatedMembership.personId,
      eventId: updatedMembership.eventId,
      role: updatedMembership.role,
      rsvpStatus: updatedMembership.rsvpStatus,
    };

    yield* Effect.logInfo('Member role updated successfully', {
      userId, // Who performed the action
      targetUserId: targetMembership.personId, // Who is being affected
      membershipId,
      eventId: targetMembership.eventId,
      oldRole: targetMembership.role,
      newRole: role,
      operation: 'update',
    });

    // Determine if this is a promotion or demotion
    const roleHierarchy = { ATTENDEE: 1, MODERATOR: 2, ORGANIZER: 3 };
    const oldRoleLevel = roleHierarchy[targetMembership.role];
    const newRoleLevel = roleHierarchy[role];

    if (newRoleLevel > oldRoleLevel) {
      // Promotion - notify the user being promoted
      yield* Effect.fork(
        createEventNotifications({
          eventId: targetMembership.eventId,
          type: 'USER_PROMOTED',
          authorId: userId,
        }).pipe(
          Effect.catchAll(error => {
            return Effect.gen(function* () {
              yield* Effect.void;
              yield* Effect.logWarning(
                'Failed to create USER_PROMOTED notifications',
                {
                  eventId: targetMembership.eventId,
                  targetUserId: targetMembership.personId,
                  authorId: userId,
                  oldRole: targetMembership.role,
                  newRole: role,
                  error: error.message,
                  errorType: error.constructor.name,
                }
              );
              return { message: 'Promotion notification attempt completed' };
            });
          })
        )
      );
    } else if (newRoleLevel < oldRoleLevel) {
      // Demotion - notify the user being demoted
      yield* Effect.fork(
        createEventNotifications({
          eventId: targetMembership.eventId,
          type: 'USER_DEMOTED',
          authorId: userId,
        }).pipe(
          Effect.catchAll(error => {
            return Effect.gen(function* () {
              yield* Effect.void;
              yield* Effect.logWarning(
                'Failed to create USER_DEMOTED notifications',
                {
                  eventId: targetMembership.eventId,
                  targetUserId: targetMembership.personId,
                  authorId: userId,
                  oldRole: targetMembership.role,
                  newRole: role,
                  error: error.message,
                  errorType: error.constructor.name,
                }
              );
              return { message: 'Demotion notification attempt completed' };
            });
          })
        )
      );
    }

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to update member role', {
            userId,
            membershipId,
            newRole: role,
            reason: 'insufficient_permissions',
            operation: 'updateMemberRole',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError('Failed to update member role'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, MembershipDTO])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('memberships'))
  );
};

/**
 * Remove member from event
 */
export const removeMemberFromEvent = async ({
  membershipId,
}: RemoveMemberFromEventParams): Promise<
  ResultTuple<
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | OperationError
    | AuthenticationError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Removing member from event', {
      membershipId,
      userId,
    });

    // Check if current user can remove members
    const targetMembership = yield* Effect.promise(() =>
      db.membership.findUnique({
        where: { id: membershipId },
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
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'removeMemberFromEvent.findTarget',
          membershipId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!targetMembership) {
      yield* Effect.fail(new UnauthorizedError('Not a member of this event'));
      return;
    }

    const userMembership = targetMembership.event.memberships[0];
    if (
      !userMembership ||
      !['ORGANIZER', 'MODERATOR'].includes(userMembership.role)
    ) {
      yield* Effect.fail(
        new UnauthorizedError('Not authorized to remove members')
      );
      return;
    }

    // Cannot remove the organizer
    if (targetMembership.role === 'ORGANIZER') {
      yield* Effect.fail(
        new UnauthorizedError('Cannot remove the event organizer')
      );
      return;
    }

    yield* Effect.promise(() =>
      db.membership.delete({
        where: { id: membershipId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'removeMemberFromEvent.deleteMembership',
          membershipId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    const result = { message: 'Member removed successfully' };

    yield* Effect.logInfo('Member removed from event successfully', {
      userId, // Who performed the action
      targetUserId: targetMembership.personId, // Who was removed
      membershipId,
      eventId: targetMembership.eventId,
      operation: 'delete',
    });

    // Trigger USER_LEFT notification for event members (fire-and-forget)
    yield* Effect.fork(
      createEventNotifications({
        eventId: targetMembership.eventId,
        type: 'USER_LEFT',
        authorId: targetMembership.personId, // The person who left
      }).pipe(
        Effect.catchAll(error => {
          return Effect.gen(function* () {
            yield* Effect.void;
            yield* Effect.logWarning(
              'Failed to create USER_LEFT notifications',
              {
                eventId: targetMembership.eventId,
                targetUserId: targetMembership.personId,
                removedBy: userId,
                error: error.message,
                errorType: error.constructor.name,
              }
            );
            return { message: 'User left notification attempt completed' };
          });
        })
      )
    );

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to remove member', {
            userId,
            membershipId,
            reason: 'insufficient_permissions',
            operation: 'removeMemberFromEvent',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return OperationError
        return [
          new OperationError('Failed to remove member'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('memberships'))
  );
};

import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetPersonDataParams,
  GetUserDashboardDataParams,
  DeleteUserParams,
} from '@groupi/schema/params';
import { UserDashboardData, PersonBasicData } from '@groupi/schema/data';
import {
  NotFoundError,
  DatabaseError,
  ConnectionError,
  OperationError,
  AuthenticationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
/**
 * Fetch basic person data by ID
 */
export const fetchPersonData = async ({
  personId,
}: GetPersonDataParams): Promise<
  ResultTuple<DatabaseError | NotFoundError | ConnectionError, PersonBasicData>
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching person data', {
      personId,
    });

    // Database operation with retry on connection issues
    const person = yield* Effect.promise(() =>
      db.person.findUnique({
        where: { id: personId },
        select: {
          id: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Person', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchPersonData',
          personId,
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

    if (!person) {
      yield* Effect.fail(
        new NotFoundError({ message: `Person not found`, cause: personId })
      );
      return;
    }

    // Fetch corresponding User data for display info
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: person.id },
        select: {
          name: true,
          email: true,
          image: true,
        },
      })
    ).pipe(Effect.mapError((cause: Error) => getPrismaError('User', cause)));

    // Direct construction
    const result: PersonBasicData = {
      id: person.id,
      name: user?.name || null,
      email: user?.email || '',
      image: user?.image || null,
    };

    yield* Effect.logDebug('Person data fetched successfully', {
      personId,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logInfo('Person not found', {
            personId,
            operation: 'fetchPersonData',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError({ message: 'Failed to fetch person data' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PersonBasicData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('persons'))
  );
};

/**
 * Fetch user dashboard data (person + their events)
 */
export const fetchUserDashboardData = async (
  _params: GetUserDashboardDataParams
): Promise<
  ResultTuple<
    DatabaseError | NotFoundError | ConnectionError | AuthenticationError,
    UserDashboardData
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching user dashboard data', {
      userId,
    });

    // Fetch User data first
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          imageKey: true,
          pronouns: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchUserDashboardData',
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

    if (!user) {
      yield* Effect.fail(
        new NotFoundError({ message: `User not found`, cause: userId })
      );
      return;
    }

    // Fetch Person data with memberships
    const person = yield* Effect.promise(() =>
      db.person.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  location: true,
                  chosenDateTime: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
            orderBy: { event: { updatedAt: 'desc' } },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Person', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'fetchUserDashboardData',
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

    if (!person) {
      yield* Effect.fail(
        new NotFoundError({ message: `Person not found`, cause: userId })
      );
      return;
    }

    // Direct construction
    const result: UserDashboardData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      imageKey: user.imageKey,
      pronouns: user.pronouns,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      memberships: person?.memberships.map(membership => ({
        id: membership.id,
        role: membership.role,
        rsvpStatus: membership.rsvpStatus,
        event: {
          id: membership.event.id,
          title: membership.event.title,
          description: membership.event.description,
          location: membership.event.location,
          chosenDateTime: membership.event.chosenDateTime,
          createdAt: membership.event.createdAt,
          updatedAt: membership.event.updatedAt,
        },
      })),
    };

    yield* Effect.logDebug('User dashboard data fetched successfully', {
      userId,
      eventCount: result.memberships.length,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logInfo('Person not found', {
            userId,
            operation: 'fetchUserDashboardData',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError({ message: 'Failed to fetch user dashboard data' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, UserDashboardData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('persons'))
  );
};

// NOTE: createUser and updateUser functions have been removed.
// Use createUserAdmin, updateUserAdmin, and deleteUserAdmin from auth.ts instead.
// Those functions properly handle both User (auth) and Person (app data) records.

/**
 * Delete user
 * Retries on DatabaseError
 */
export const deleteUser = async ({
  userId,
}: DeleteUserParams): Promise<
  ResultTuple<
    NotFoundError | OperationError | DatabaseError | ConnectionError,
    { message: string }
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting user', {
      userId,
    });

    yield* Effect.promise(() =>
      db.person.delete({
        where: { id: userId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Person', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteUser',
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

    const result = { message: 'User deleted successfully' };

    yield* Effect.logInfo('User deleted successfully', {
      userId, // Who was deleted
      operation: 'delete',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Check for specific error types
        if (err instanceof Error && err.message.includes('not found')) {
          yield* Effect.logInfo('User not found for deletion', {
            userId,
            operation: 'deleteUser',
          });
          return [
            new NotFoundError({ message: `Person not found`, cause: userId }),
            undefined,
          ] as const;
        }

        // For unexpected errors, return OperationError
        return [
          new OperationError({ message: 'Failed to delete user' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, { message: string }])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('persons'))
  );
};

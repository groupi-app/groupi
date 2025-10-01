import { Effect, Schedule } from 'effect';
import { auth } from '@clerk/nextjs/server';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetPersonDataParams,
  GetUserDashboardDataParams,
  CreateUserFromWebhookParams,
  UpdateUserFromWebhookParams,
  DeleteUserFromWebhookParams,
} from '@groupi/schema/params';
import { UserDashboardDTO, PersonBasicDTO } from '@groupi/schema/data';
import {
  NotFoundError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
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
  ResultTuple<DatabaseError | NotFoundError | ConnectionError, PersonBasicDTO>
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
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
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

    if (!person) {
      yield* Effect.fail(new NotFoundError(`Person not found`, personId));
      return;
    }

    // Direct construction - no factory needed
    const result: PersonBasicDTO = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      username: person.username,
      imageUrl: person.imageUrl,
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
          new DatabaseError('Failed to fetch person data'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PersonBasicDTO])
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
    UserDashboardDTO
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching user dashboard data', {
      userId,
    });

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

    if (!person) {
      yield* Effect.fail(new NotFoundError(`Person not found`, userId));
      return;
    }

    // Direct construction - no factory needed
    const result: UserDashboardDTO = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      username: person.username,
      imageUrl: person.imageUrl,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      memberships: person.memberships.map(membership => ({
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
          new DatabaseError('Failed to fetch user dashboard data'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, UserDashboardDTO])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('persons'))
  );
};

/**
 * Create user from webhook (Clerk webhook)
 * Retries on DatabaseError
 */
export const createUserFromWebhook = async (
  userData: CreateUserFromWebhookParams
): Promise<
  ResultTuple<
    | OperationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    PersonBasicDTO
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating user from webhook', {
      userId: userData.id,
      username: userData.username,
    });

    const person = yield* Effect.promise(() =>
      db.person.create({
        data: {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          imageUrl: userData.imageUrl,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Person', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createUserFromWebhook',
          userId: userData.id,
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
    const result: PersonBasicDTO = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      username: person.username,
      imageUrl: person.imageUrl,
    };

    yield* Effect.logInfo('User created from webhook successfully', {
      userId: userData.id, // Who was created
      username: userData.username,
      operation: 'create',
    });

    return result;
  }).pipe(
    Effect.catchAll(_err => {
      return Effect.succeed([
        new OperationError('Failed to create user from webhook'),
        undefined,
      ] as const);
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PersonBasicDTO])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('persons'))
  );
};

/**
 * Update user from webhook (Clerk webhook)
 * Retries on DatabaseError
 */
export const updateUserFromWebhook = async (
  userData: UpdateUserFromWebhookParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    PersonBasicDTO
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating user from webhook', {
      userId: userData.id,
      username: userData.username,
    });

    const person = yield* Effect.promise(() =>
      db.person.update({
        where: { id: userData.id },
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          imageUrl: userData.imageUrl,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Person', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateUserFromWebhook',
          userId: userData.id,
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
    const result: PersonBasicDTO = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      username: person.username,
      imageUrl: person.imageUrl,
    };

    yield* Effect.logInfo('User updated from webhook successfully', {
      userId: userData.id, // Who was updated
      username: userData.username,
      operation: 'update',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Check for specific error types
        if (err instanceof Error && err.message.includes('not found')) {
          yield* Effect.logInfo('User not found for webhook update', {
            userId: userData.id,
            operation: 'updateUserFromWebhook',
          });
          return [
            new NotFoundError(`Person not found`, userData.id),
            undefined,
          ] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError('Failed to update user from webhook'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PersonBasicDTO])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('persons'))
  );
};

/**
 * Delete user from webhook (Clerk webhook)
 * Retries on DatabaseError
 */
export const deleteUserFromWebhook = async ({
  userId,
}: DeleteUserFromWebhookParams): Promise<
  ResultTuple<
    NotFoundError | OperationError | DatabaseError | ConnectionError,
    { message: string }
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting user from webhook', {
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
          operation: 'deleteUserFromWebhook',
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

    const result = { message: 'User deleted successfully' };

    yield* Effect.logInfo('User deleted from webhook successfully', {
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
          yield* Effect.logInfo('User not found for webhook deletion', {
            userId,
            operation: 'deleteUserFromWebhook',
          });
          return [
            new NotFoundError(`Person not found`, userId),
            undefined,
          ] as const;
        }

        // For unexpected errors, return OperationError
        return [
          new OperationError('Failed to delete user from webhook'),
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

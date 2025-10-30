import { Effect } from 'effect';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';

/**
 * Create or sync a Person record from User data
 * This helps during the migration from Clerk to Better Auth
 */
export const syncUserToPerson = async (
  userId: string,
  userData: {
    name?: string;
    email: string;
    image?: string;
  }
): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | ConstraintError | ValidationError,
    { id: string }
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Syncing user to person', {
      userId,
      email: userData.email,
    });

    // Check if Person already exists
    const existingPerson = yield* Effect.promise(() =>
      db.person.findUnique({
        where: { id: userId },
      })
    ).pipe(Effect.mapError((cause: Error) => getPrismaError('Person', cause)));

    if (existingPerson) {
      yield* Effect.logDebug('Person already exists', { userId });
      return { id: existingPerson.id };
    }

    // Create new Person record (just the ID, user data lives in User table)
    const person = yield* Effect.promise(() =>
      db.person.create({
        data: {
          id: userId,
        },
      })
    ).pipe(Effect.mapError((cause: Error) => getPrismaError('Person', cause)));

    yield* Effect.logInfo('Created Person record', {
      userId,
      personId: person.id,
    });

    return { id: person.id };
  });

  return Effect.runPromise(
    effect.pipe(Effect.provide(createEffectLoggerLayer('user-migration')))
  );
};

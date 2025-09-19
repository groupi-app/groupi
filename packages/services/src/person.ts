import { Effect } from 'effect';
import { z } from 'zod';
import { db } from './db';
import { SentryHelpers } from './sentry';
import {
  createUserDashboardDTO,
  PrismaUserDashboard,
  UserDashboardDTO,
} from '@groupi/schema';
import { safeWrapper } from './shared/safe-wrapper';

// Import shared patterns
import { dbOperation } from './shared/effect-patterns';
import { Prisma } from '@prisma/client';
import { BatchPayloadSchema } from './shared/operations';

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for user webhook data
export const UserWebhookSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string(),
  imageUrl: z.string(),
});

// ============================================================================
// ERROR TYPES
// ============================================================================

export class PersonNotFoundError extends Error {
  readonly _tag = 'PersonNotFoundError';
  constructor(userId: string) {
    super(`Person not found: ${userId}`);
  }
}

export class PersonCreationError extends Error {
  readonly _tag = 'PersonCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create person');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class PersonUpdateError extends Error {
  readonly _tag = 'PersonUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update person');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class PersonDeletionError extends Error {
  readonly _tag = 'PersonDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete person');
    if (cause) {
      this.cause = cause;
    }
  }
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to fetch person data
export const fetchPersonDataEffect = (userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      if (!userId) {
        return yield* _(Effect.fail(new PersonNotFoundError(userId)));
      }

      // Fetch person data (database operation with retry)
      const person = yield* _(
        dbOperation(
          () =>
            db.person.findUnique({
              where: { id: userId },
              include: {
                memberships: {
                  include: {
                    event: {
                      include: { memberships: { include: { person: true } } },
                    },
                  },
                },
              },
            }),
          _error => new PersonNotFoundError(userId),
          `Fetch person data: ${userId}`
        )
      );

      if (!person) {
        return yield* _(Effect.fail(new PersonNotFoundError(userId)));
      }

      // Transform to DTO
      const personDTO = createUserDashboardDTO(person as PrismaUserDashboard);

      return personDTO;
    }),
    'person',
    'fetchPersonData',
    userId
  );

// Modernized Effect-based function to create user from webhook
export const createUserFromWebhookEffect = (userData: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
}) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Create user from webhook (database operation with retry)
      const person = yield* _(
        dbOperation(
          () =>
            db.person.create({
              data: {
                id: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                imageUrl: userData.imageUrl,
                settings: {
                  create: {}, // Empty object will create PersonSettings with defaults
                },
              },
              include: {
                settings: true,
              },
            }),
          error => new PersonCreationError(error),
          `Create user from webhook: ${userData.id}`
        )
      );

      return person;
    }),
    'person',
    'createUserFromWebhook',
    userData.id
  );

// Modernized Effect-based function to update user from webhook
export const updateUserFromWebhookEffect = (userData: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
}) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Update user from webhook (database operation with retry)
      const person = yield* _(
        dbOperation(
          () =>
            db.person.upsert({
              where: { id: userData.id },
              update: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                imageUrl: userData.imageUrl,
              },
              create: {
                id: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                imageUrl: userData.imageUrl,
                settings: {
                  create: {},
                },
              },
              include: {
                settings: true,
              },
            }),
          error => new PersonUpdateError(error),
          `Update user from webhook: ${userData.id}`
        )
      );

      return person;
    }),
    'person',
    'updateUserFromWebhook',
    userData.id
  );

// Modernized Effect-based function to delete user from webhook
export const deleteUserFromWebhookEffect = (userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Delete user from webhook (database operation with retry)
      const result = yield* _(
        dbOperation(
          () =>
            db.person.deleteMany({
              where: {
                id: userId,
              },
            }),
          error => new PersonDeletionError(error),
          `Delete user from webhook: ${userId}`
        )
      );

      return result;
    }),
    'person',
    'deleteUserFromWebhook',
    userId
  );

// ============================================================================
// SAFE WRAPPERS WITH CUSTOM ERROR TYPES
// ============================================================================

export const fetchPersonData = safeWrapper<
  [string],
  z.infer<typeof UserDashboardDTO>,
  PersonNotFoundError
>(
  (userId: string) => Effect.runPromise(fetchPersonDataEffect(userId)),
  UserDashboardDTO
);

export const createUserFromWebhook = safeWrapper<
  [
    {
      id: string;
      firstName: string | null;
      lastName: string | null;
      username: string;
      imageUrl: string;
    },
  ],
  z.infer<typeof UserWebhookSchema>,
  PersonCreationError
>(
  (userData: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
  }) => Effect.runPromise(createUserFromWebhookEffect(userData)),
  UserWebhookSchema
);

export const updateUserFromWebhook = safeWrapper<
  [
    {
      id: string;
      firstName: string | null;
      lastName: string | null;
      username: string;
      imageUrl: string;
    },
  ],
  z.infer<typeof UserWebhookSchema>,
  PersonUpdateError
>(
  (userData: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
  }) => Effect.runPromise(updateUserFromWebhookEffect(userData)),
  UserWebhookSchema
);

export const deleteUserFromWebhook = safeWrapper<
  [string],
  z.infer<typeof BatchPayloadSchema>,
  PersonDeletionError
>(
  (userId: string) => Effect.runPromise(deleteUserFromWebhookEffect(userId)),
  BatchPayloadSchema
);

import { Effect, pipe } from 'effect';
import { cache } from 'react';
import { db } from './db';
import { createUserDashboardDTO, } from '@groupi/schema';
// Error types for better error handling
export class PersonNotFoundError extends Error {
    _tag = 'PersonNotFoundError';
    constructor(userId) {
        super(`Person not found: ${userId}`);
    }
}
export class PersonCreationError extends Error {
    _tag = 'PersonCreationError';
    constructor(cause) {
        super('Failed to create person');
        if (cause) {
            this.cause = cause;
        }
    }
}
export class PersonUpdateError extends Error {
    _tag = 'PersonUpdateError';
    constructor(cause) {
        super('Failed to update person');
        if (cause) {
            this.cause = cause;
        }
    }
}
export class PersonDeletionError extends Error {
    _tag = 'PersonDeletionError';
    constructor(cause) {
        super('Failed to delete person');
        if (cause) {
            this.cause = cause;
        }
    }
}
// Effect-based service functions
export const fetchPersonDataEffect = (userId) => Effect.gen(function* (_) {
    if (!userId) {
        return yield* _(Effect.fail(new PersonNotFoundError(userId)));
    }
    const person = yield* _(Effect.tryPromise({
        try: () => db.person.findUnique({
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
        catch: error => new PersonNotFoundError(userId),
    }));
    if (!person) {
        return yield* _(Effect.fail(new PersonNotFoundError(userId)));
    }
    // Transform to DTO
    const personDTO = createUserDashboardDTO(person);
    return personDTO;
});
export const createUserFromWebhookEffect = (userData) => Effect.tryPromise({
    try: () => db.person.create({
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
    catch: error => new PersonCreationError(error),
});
export const updateUserFromWebhookEffect = (userData) => Effect.tryPromise({
    try: () => db.person.upsert({
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
    catch: error => new PersonUpdateError(error),
});
export const deleteUserFromWebhookEffect = (userId) => Effect.tryPromise({
    try: () => db.person.deleteMany({
        where: {
            id: userId,
        },
    }),
    catch: error => new PersonDeletionError(error),
});
// Legacy functions for backward compatibility (wrapped with Effect)
export const fetchPersonData = cache(async (userId) => {
    const result = await Effect.runPromise(pipe(fetchPersonDataEffect(userId), Effect.map(personDTO => ({ success: personDTO })), Effect.catchAll(error => Effect.succeed({ error: error.message }))));
    return result;
});
// Webhook functions for user management (legacy wrappers)
export async function createUserFromWebhook(userData) {
    return Effect.runPromise(createUserFromWebhookEffect(userData));
}
export async function updateUserFromWebhook(userData) {
    return Effect.runPromise(updateUserFromWebhookEffect(userData));
}
export async function deleteUserFromWebhook(userId) {
    return Effect.runPromise(deleteUserFromWebhookEffect(userId));
}

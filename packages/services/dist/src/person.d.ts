import { Effect } from 'effect';
import { ActionResponse } from '@groupi/schema/types';
import { UserDashboardDTO } from '@groupi/schema';
export declare class PersonNotFoundError extends Error {
    readonly _tag = "PersonNotFoundError";
    constructor(userId: string);
}
export declare class PersonCreationError extends Error {
    readonly _tag = "PersonCreationError";
    cause?: unknown;
    constructor(cause?: unknown);
}
export declare class PersonUpdateError extends Error {
    readonly _tag = "PersonUpdateError";
    cause?: unknown;
    constructor(cause?: unknown);
}
export declare class PersonDeletionError extends Error {
    readonly _tag = "PersonDeletionError";
    cause?: unknown;
    constructor(cause?: unknown);
}
export declare const fetchPersonDataEffect: (userId: string) => Effect.Effect<any, PersonNotFoundError, never>;
export declare const createUserFromWebhookEffect: (userData: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}) => Effect.Effect<{
    settings: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        personId: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}, PersonCreationError, never>;
export declare const updateUserFromWebhookEffect: (userData: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}) => Effect.Effect<{
    settings: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        personId: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}, PersonUpdateError, never>;
export declare const deleteUserFromWebhookEffect: (userId: string) => Effect.Effect<import("@prisma/client").Prisma.BatchPayload, PersonDeletionError, never>;
export declare const fetchPersonData: (userId: string) => Promise<ActionResponse<UserDashboardDTO>>;
export declare function createUserFromWebhook(userData: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}): Promise<{
    settings: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        personId: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}>;
export declare function updateUserFromWebhook(userData: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}): Promise<{
    settings: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        personId: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
}>;
export declare function deleteUserFromWebhook(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;

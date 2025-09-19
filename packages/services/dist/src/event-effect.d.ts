import { Effect } from 'effect';
export declare class EventNotFoundError extends Error {
    readonly _tag = "EventNotFoundError";
    constructor(eventId: string);
}
export declare class UserNotFoundError extends Error {
    readonly _tag = "UserNotFoundError";
    constructor();
}
export declare class UserNotMemberError extends Error {
    readonly _tag = "UserNotMemberError";
    constructor(eventId: string, userId: string);
}
export declare class EventCreationError extends Error {
    readonly _tag = "EventCreationError";
    cause?: unknown;
    constructor(cause?: unknown);
}
export declare class EventUpdateError extends Error {
    readonly _tag = "EventUpdateError";
    cause?: unknown;
    constructor(cause?: unknown);
}
export declare class EventDeletionError extends Error {
    readonly _tag = "EventDeletionError";
    cause?: unknown;
    constructor(cause?: unknown);
}
export declare const fetchEventDataEffect: (eventId: string) => Effect.Effect<{
    event: any;
    userMembership: any;
    userId: string;
}, EventNotFoundError | UserNotFoundError | UserNotMemberError, never>;
export declare const createEventEffect: (eventData: {
    title: string;
    description?: string;
    location?: string;
    dateTime?: string;
    potentialDateTimes?: string[];
}) => Effect.Effect<{
    memberships: {
        id: string;
        personId: string;
        eventId: string;
        role: import("@prisma/client").$Enums.Role;
        rsvpStatus: import("@prisma/client").$Enums.Status;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
}, UserNotFoundError | EventCreationError, never>;
export declare const deleteEventEffect: (eventId: string) => Effect.Effect<{
    success: boolean;
}, Error, never>;

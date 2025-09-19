import { Effect } from 'effect';
import { ActionResponse } from '@groupi/schema/types';
import { EventNotFoundError, UserNotFoundError, UserNotMemberError, EventCreationError } from './event-effect';
export declare const fetchEventDataAction: (eventId: string) => Promise<ActionResponse<any>>;
export declare const createEventAction: (eventData: {
    title: string;
    description?: string;
    location?: string;
    dateTime?: string;
    potentialDateTimes?: string[];
}) => Promise<ActionResponse<any>>;
export declare const deleteEventAction: (eventId: string) => Promise<ActionResponse<any>>;
export declare const createEventWithNotificationsEffect: (eventData: {
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
export declare const fetchMultipleEventsEffect: (eventIds: string[]) => Effect.Effect<{
    event: any;
    userMembership: any;
    userId: string;
}[], EventNotFoundError | UserNotFoundError | UserNotMemberError, never>;
export declare const fetchEventDataConditionally: (eventId: string, userId: string) => Effect.Effect<{
    event: any;
    userMembership: any;
    userId: string;
}, boolean | EventNotFoundError | UserNotFoundError | UserNotMemberError, never>;
export declare const createEventWithObservability: (eventData: {
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

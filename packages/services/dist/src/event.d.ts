import { ActionResponse } from '@groupi/schema/types';
import { EventDetailsDTO, EventPageDTO, EventMemberAvailabilityDTO } from '@groupi/schema';
export interface EventData {
    event: EventDetailsDTO;
    userMembership: EventMemberAvailabilityDTO;
    userId: string;
}
export interface EventDataWithPosts {
    event: EventPageDTO;
    userMembership: EventMemberAvailabilityDTO;
    userId: string;
}
interface CreateEventProps {
    title: string;
    description?: string;
    location?: string;
    dateTime?: string;
    potentialDateTimes?: string[];
}
interface UpdateEventDetailsProps {
    id: string;
    title: string;
    description?: string;
    location?: string;
}
export declare const fetchEventData: (eventId: string) => Promise<ActionResponse<EventData>>;
export declare const fetchEventPageData: (eventId: string) => Promise<ActionResponse<EventDataWithPosts>>;
export declare function createEvent({ title, description, location, dateTime, potentialDateTimes, }: CreateEventProps): Promise<{
    error: string;
    success?: undefined;
} | {
    success: {
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
    };
    error?: undefined;
}>;
export declare function updateEventDetails({ id, title, description, location, }: UpdateEventDetailsProps): Promise<{
    error: string;
    success?: undefined;
} | {
    success: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
    };
    error?: undefined;
}>;
export declare function updateEventDateTime({ eventId, dateTime, }: {
    eventId: string;
    dateTime: string;
}): Promise<{
    error: string;
    success?: undefined;
} | {
    success: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
    };
    error?: undefined;
}>;
export declare function updateEventPotentialDateTimes({ eventId, potentialDateTimes, }: {
    eventId: string;
    potentialDateTimes: string[];
}): Promise<{
    error: string;
    success?: undefined;
} | {
    success: {
        potentialDateTimes: {
            id: string;
            eventId: string;
            dateTime: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
    };
    error?: undefined;
}>;
export declare function deleteEvent(eventId: string): Promise<{
    error: string;
    success?: undefined;
} | {
    success: string;
    error?: undefined;
}>;
export declare function leaveEvent(eventId: string): Promise<{
    error: string;
    success?: undefined;
} | {
    success: string;
    error?: undefined;
}>;
export {};

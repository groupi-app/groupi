import { z } from 'zod';
import type { PotentialDateTime as PrismaPotentialDateTime, Availability as PrismaAvailability, Membership, Person } from '../generated';
export declare const DateSelectionAvailabilityDTO: z.ZodObject<Pick<{
    status: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
    membershipId: z.ZodString;
    potentialDateTimeId: z.ZodString;
}, "status" | "potentialDateTimeId"> & {
    membership: z.ZodObject<Pick<{
        role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
        rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
        id: z.ZodString;
        personId: z.ZodString;
        eventId: z.ZodString;
    }, "id"> & {
        person: z.ZodObject<Pick<{
            id: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
            firstName: z.ZodNullable<z.ZodString>;
            lastName: z.ZodNullable<z.ZodString>;
            username: z.ZodString;
            imageUrl: z.ZodString;
        }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        person: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }, {
        id: string;
        person: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    status: "YES" | "MAYBE" | "NO" | "PENDING";
    potentialDateTimeId: string;
    membership: {
        id: string;
        person: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    };
}, {
    status: "YES" | "MAYBE" | "NO" | "PENDING";
    potentialDateTimeId: string;
    membership: {
        id: string;
        person: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    };
}>;
export type DateSelectionAvailabilityDTO = z.infer<typeof DateSelectionAvailabilityDTO>;
export declare const DateOptionDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    eventId: z.ZodString;
    dateTime: z.ZodDate;
}, "id" | "dateTime"> & {
    availabilities: z.ZodArray<z.ZodObject<Pick<{
        status: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
        membershipId: z.ZodString;
        potentialDateTimeId: z.ZodString;
    }, "status" | "potentialDateTimeId"> & {
        membership: z.ZodObject<Pick<{
            role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
            rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
            id: z.ZodString;
            personId: z.ZodString;
            eventId: z.ZodString;
        }, "id"> & {
            person: z.ZodObject<Pick<{
                id: z.ZodString;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
                firstName: z.ZodNullable<z.ZodString>;
                lastName: z.ZodNullable<z.ZodString>;
                username: z.ZodString;
                imageUrl: z.ZodString;
            }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            }, {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            person: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }, {
            id: string;
            person: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
        membership: {
            id: string;
            person: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        };
    }, {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
        membership: {
            id: string;
            person: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    dateTime: Date;
    availabilities: {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
        membership: {
            id: string;
            person: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        };
    }[];
}, {
    id: string;
    dateTime: Date;
    availabilities: {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
        membership: {
            id: string;
            person: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        };
    }[];
}>;
export type DateOptionDTO = z.infer<typeof DateOptionDTO>;
export declare const EventMemberAvailabilityDTO: z.ZodObject<Pick<{
    role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
    rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
    id: z.ZodString;
    personId: z.ZodString;
    eventId: z.ZodString;
}, "id" | "role" | "rsvpStatus"> & {
    person: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
    availabilities: z.ZodArray<z.ZodObject<Pick<{
        status: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
        membershipId: z.ZodString;
        potentialDateTimeId: z.ZodString;
    }, "status" | "potentialDateTimeId">, "strip", z.ZodTypeAny, {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
    }, {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
    rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    person: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    availabilities: {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
    }[];
}, {
    id: string;
    role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
    rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    person: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    availabilities: {
        status: "YES" | "MAYBE" | "NO" | "PENDING";
        potentialDateTimeId: string;
    }[];
}>;
export type EventMemberAvailabilityDTO = z.infer<typeof EventMemberAvailabilityDTO>;
export type PrismaPotentialDateTimeWithAvailabilities = PrismaPotentialDateTime & {
    availabilities: Array<PrismaAvailability & {
        membership: Membership & {
            person: Person;
        };
    }>;
};
export type PrismaMembershipWithAvailabilities = Membership & {
    person: Person;
    availabilities: Array<PrismaAvailability & {
        potentialDateTime: PrismaPotentialDateTime;
    }>;
    event: {
        id: string;
        title: string;
    };
};
export declare function createDateOptionDTO(pdt: PrismaPotentialDateTimeWithAvailabilities): DateOptionDTO;
export declare function createEventMemberAvailabilityDTO(member: PrismaMembershipWithAvailabilities): EventMemberAvailabilityDTO;

import { z } from 'zod';
import type { Event as PrismaEvent, Invite as PrismaInvite, Membership } from '../generated';
export declare const EventInviteDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    eventId: z.ZodString;
    createdById: z.ZodString;
    createdAt: z.ZodDate;
    expiresAt: z.ZodDate;
    usesRemaining: z.ZodNullable<z.ZodNumber>;
    maxUses: z.ZodNullable<z.ZodNumber>;
    name: z.ZodNullable<z.ZodString>;
}, "id" | "createdAt" | "eventId" | "createdById" | "expiresAt" | "usesRemaining" | "maxUses" | "name"> & {
    createdBy: z.ZodObject<Pick<{
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
    id: string;
    createdAt: Date;
    eventId: string;
    createdById: string;
    expiresAt: Date;
    usesRemaining: number | null;
    maxUses: number | null;
    name: string | null;
    createdBy: {
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
    id: string;
    createdAt: Date;
    eventId: string;
    createdById: string;
    expiresAt: Date;
    usesRemaining: number | null;
    maxUses: number | null;
    name: string | null;
    createdBy: {
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
export type EventInviteDTO = z.infer<typeof EventInviteDTO>;
export declare const EventInviteManagementDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    chosenDateTime: z.ZodNullable<z.ZodDate>;
}, "id" | "createdAt" | "updatedAt" | "title" | "description" | "location" | "chosenDateTime"> & {
    invites: z.ZodArray<z.ZodObject<Pick<{
        id: z.ZodString;
        eventId: z.ZodString;
        createdById: z.ZodString;
        createdAt: z.ZodDate;
        expiresAt: z.ZodDate;
        usesRemaining: z.ZodNullable<z.ZodNumber>;
        maxUses: z.ZodNullable<z.ZodNumber>;
        name: z.ZodNullable<z.ZodString>;
    }, "id" | "createdAt" | "eventId" | "createdById" | "expiresAt" | "usesRemaining" | "maxUses" | "name"> & {
        createdBy: z.ZodObject<Pick<{
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
        id: string;
        createdAt: Date;
        eventId: string;
        createdById: string;
        expiresAt: Date;
        usesRemaining: number | null;
        maxUses: number | null;
        name: string | null;
        createdBy: {
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
        id: string;
        createdAt: Date;
        eventId: string;
        createdById: string;
        expiresAt: Date;
        usesRemaining: number | null;
        maxUses: number | null;
        name: string | null;
        createdBy: {
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
    memberships: z.ZodArray<z.ZodObject<Pick<{
        role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
        rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
        id: z.ZodString;
        personId: z.ZodString;
        eventId: z.ZodString;
    }, "id" | "personId" | "eventId" | "role" | "rsvpStatus">, "strip", z.ZodTypeAny, {
        id: string;
        personId: string;
        eventId: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }, {
        id: string;
        personId: string;
        eventId: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberships: {
        id: string;
        personId: string;
        eventId: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }[];
    invites: {
        id: string;
        createdAt: Date;
        eventId: string;
        createdById: string;
        expiresAt: Date;
        usesRemaining: number | null;
        maxUses: number | null;
        name: string | null;
        createdBy: {
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
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberships: {
        id: string;
        personId: string;
        eventId: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }[];
    invites: {
        id: string;
        createdAt: Date;
        eventId: string;
        createdById: string;
        expiresAt: Date;
        usesRemaining: number | null;
        maxUses: number | null;
        name: string | null;
        createdBy: {
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
export type EventInviteManagementDTO = z.infer<typeof EventInviteManagementDTO>;
export type PrismaEventWithInvites = PrismaEvent & {
    invites: Array<PrismaInvite & {
        createdBy: Membership & {
            person: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        };
    }>;
    memberships: Membership[];
};
export declare const IndividualInviteDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    eventId: z.ZodString;
    createdById: z.ZodString;
    createdAt: z.ZodDate;
    expiresAt: z.ZodDate;
    usesRemaining: z.ZodNullable<z.ZodNumber>;
    maxUses: z.ZodNullable<z.ZodNumber>;
    name: z.ZodNullable<z.ZodString>;
}, "id" | "createdAt" | "eventId" | "createdById" | "expiresAt" | "usesRemaining" | "maxUses" | "name"> & {
    createdBy: z.ZodObject<Pick<{
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
} & {
    event: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        title: z.ZodString;
        description: z.ZodString;
        location: z.ZodString;
        chosenDateTime: z.ZodNullable<z.ZodDate>;
    }, "id" | "title" | "description" | "location" | "chosenDateTime"> & {
        memberCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
        memberCount: number;
    }, {
        id: string;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
        memberCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    eventId: string;
    createdById: string;
    expiresAt: Date;
    usesRemaining: number | null;
    maxUses: number | null;
    name: string | null;
    event: {
        id: string;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
        memberCount: number;
    };
    createdBy: {
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
    id: string;
    createdAt: Date;
    eventId: string;
    createdById: string;
    expiresAt: Date;
    usesRemaining: number | null;
    maxUses: number | null;
    name: string | null;
    event: {
        id: string;
        title: string;
        description: string;
        location: string;
        chosenDateTime: Date | null;
        memberCount: number;
    };
    createdBy: {
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
export type IndividualInviteDTO = z.infer<typeof IndividualInviteDTO>;
export declare function createEventInviteDTO(invite: PrismaInvite & {
    createdBy: Membership & {
        person: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    };
}): EventInviteDTO;
export declare function createEventInviteManagementDTO(event: PrismaEventWithInvites): EventInviteManagementDTO;
export declare function createIndividualInviteDTO(invite: PrismaInvite & {
    event: PrismaEvent & {
        memberships: Membership[];
    };
    createdBy: Membership & {
        person: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    };
}): IndividualInviteDTO;

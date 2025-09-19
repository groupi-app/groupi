import { z } from 'zod';
import type { Event as PrismaEvent, Membership, Person } from '../generated';
export declare const EventCardDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    chosenDateTime: z.ZodNullable<z.ZodDate>;
}, "id" | "createdAt" | "updatedAt" | "title" | "description" | "location" | "chosenDateTime"> & {
    memberCount: z.ZodNumber;
    owner: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberCount: number;
    owner: {
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberCount: number;
    owner: {
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
}>;
export type EventCardDTO = z.infer<typeof EventCardDTO>;
export declare const EventHeaderDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    chosenDateTime: z.ZodNullable<z.ZodDate>;
}, "id" | "title" | "description" | "location" | "chosenDateTime"> & {
    userMembership: z.ZodObject<{
        role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
        rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
    }, "strip", z.ZodTypeAny, {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }, {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    userMembership: {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    };
}, {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    userMembership: {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    };
}>;
export type EventHeaderDTO = z.infer<typeof EventHeaderDTO>;
export declare const EventDetailsDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    chosenDateTime: z.ZodNullable<z.ZodDate>;
}, "id" | "title" | "description" | "location" | "chosenDateTime"> & {
    userMembership: z.ZodObject<{
        role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
        rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
    }, "strip", z.ZodTypeAny, {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }, {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }>;
} & {
    memberships: z.ZodArray<z.ZodObject<Pick<{
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberships: {
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
    }[];
    userMembership: {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    };
}, {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberships: {
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
    }[];
    userMembership: {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    };
}>;
export type EventDetailsDTO = z.infer<typeof EventDetailsDTO>;
export declare const EventPageDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    title: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    chosenDateTime: z.ZodNullable<z.ZodDate>;
}, "id" | "title" | "description" | "location" | "chosenDateTime"> & {
    userMembership: z.ZodObject<{
        role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
        rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
    }, "strip", z.ZodTypeAny, {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }, {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    }>;
} & {
    memberships: z.ZodArray<z.ZodObject<Pick<{
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
    }>, "many">;
} & {
    posts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        authorId: z.ZodString;
        eventId: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        replies: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            authorId: z.ZodString;
            postId: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
            author: z.ZodObject<{
                id: z.ZodString;
                firstName: z.ZodNullable<z.ZodString>;
                lastName: z.ZodNullable<z.ZodString>;
                username: z.ZodString;
                imageUrl: z.ZodString;
            }, "strip", z.ZodTypeAny, {
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
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
            author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
            author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }>, "many">;
        author: z.ZodObject<{
            id: z.ZodString;
            firstName: z.ZodNullable<z.ZodString>;
            lastName: z.ZodNullable<z.ZodString>;
            username: z.ZodString;
            imageUrl: z.ZodString;
        }, "strip", z.ZodTypeAny, {
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
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
            author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }[];
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
            author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }[];
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberships: {
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
    }[];
    posts: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
            author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }[];
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    userMembership: {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    };
}, {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    memberships: {
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
    }[];
    posts: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
            author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
            };
        }[];
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    userMembership: {
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
    };
}>;
export type EventPageDTO = z.infer<typeof EventPageDTO>;
export type PrismaEventWithMembers = PrismaEvent & {
    memberships?: Array<Membership & {
        person: Person;
    }>;
};
export declare function createEventCardDTO(event: PrismaEvent, memberships: Array<Membership & {
    person: Person;
}>): EventCardDTO;
export declare function createEventHeaderDTO(event: PrismaEvent, userMembership: {
    role: string;
    rsvpStatus: string;
}): EventHeaderDTO;
export declare function createEventDetailsDTO(eventWithMembers: PrismaEventWithMembers, currentUserId?: string): EventDetailsDTO;
export declare function createEventPageDTO(eventWithPosts: any, currentUserId?: string): EventPageDTO;
export declare const EventPostsDTO: z.ZodObject<{
    posts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        authorId: z.ZodString;
        eventId: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        replies: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            authorId: z.ZodString;
            postId: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
        }[];
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
        }[];
    }>, "many">;
    userRole: z.ZodString;
    userId: z.ZodString;
    members: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodString;
        rsvpStatus: z.ZodString;
        personId: z.ZodString;
        eventId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }, {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }>, "many">;
    eventDateTime: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    posts: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
        }[];
    }[];
    userRole: string;
    userId: string;
    members: {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }[];
    eventDateTime: Date | null;
}, {
    posts: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        eventId: string;
        authorId: string;
        content: string;
        replies: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            postId: string;
            text: string;
        }[];
    }[];
    userRole: string;
    userId: string;
    members: {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }[];
    eventDateTime: Date | null;
}>;
export type EventPostsDTO = z.infer<typeof EventPostsDTO>;
export declare const EventMembersDTO: z.ZodObject<{
    members: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodString;
        rsvpStatus: z.ZodString;
        personId: z.ZodString;
        eventId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }, {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }>, "many">;
    userRole: z.ZodString;
    userId: z.ZodString;
    eventDateTime: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    userRole: string;
    userId: string;
    members: {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }[];
    eventDateTime: Date | null;
}, {
    userRole: string;
    userId: string;
    members: {
        id: string;
        personId: string;
        eventId: string;
        role: string;
        rsvpStatus: string;
    }[];
    eventDateTime: Date | null;
}>;
export type EventMembersDTO = z.infer<typeof EventMembersDTO>;

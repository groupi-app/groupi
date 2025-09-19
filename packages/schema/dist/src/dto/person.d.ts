import { z } from 'zod';
import type { Person as PrismaPerson, Membership } from '../generated';
export declare const PersonBasicDTO: z.ZodObject<Pick<{
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
export type PersonBasicDTO = z.infer<typeof PersonBasicDTO>;
export declare const AuthorDTO: z.ZodObject<Pick<{
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
export type AuthorDTO = z.infer<typeof AuthorDTO>;
export declare const MemberDTO: z.ZodObject<Pick<{
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
}>;
export type MemberDTO = z.infer<typeof MemberDTO>;
export declare const UserContextDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    username: z.ZodString;
    imageUrl: z.ZodString;
}, "id" | "firstName" | "lastName" | "username" | "imageUrl"> & {
    role: z.ZodOptional<z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
    role?: "ORGANIZER" | "MODERATOR" | "ATTENDEE" | undefined;
}, {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
    role?: "ORGANIZER" | "MODERATOR" | "ATTENDEE" | undefined;
}>;
export type UserContextDTO = z.infer<typeof UserContextDTO>;
export type MemberWithPerson = Membership & {
    person: PrismaPerson;
};
export type PrismaUserDashboard = PrismaPerson & {
    memberships: Array<Membership & {
        event: {
            id: string;
            title: string;
            memberships: Array<Membership & {
                person: PrismaPerson;
            }>;
        };
    }>;
};
export declare const UserDashboardDTO: z.ZodObject<{
    id: z.ZodString;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    username: z.ZodString;
    imageUrl: z.ZodString;
    memberships: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
        rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
        event: z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            memberships: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
                rsvpStatus: z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>;
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
        }, {
            id: string;
            title: string;
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
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
        event: {
            id: string;
            title: string;
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
        };
    }, {
        id: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
        event: {
            id: string;
            title: string;
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
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
    memberships: {
        id: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
        event: {
            id: string;
            title: string;
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
        };
    }[];
}, {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
    memberships: {
        id: string;
        role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING";
        event: {
            id: string;
            title: string;
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
        };
    }[];
}>;
export type UserDashboardDTO = z.infer<typeof UserDashboardDTO>;
export declare function createPersonBasicDTO(person: PrismaPerson): PersonBasicDTO;
export declare const createAuthorDTO: typeof createPersonBasicDTO;
export declare function createMemberDTO(memberWithPerson: MemberWithPerson): MemberDTO;
export declare function createUserContextDTO(person: PrismaPerson, role?: string): UserContextDTO;
export declare function createUserDashboardDTO(person: PrismaUserDashboard): UserDashboardDTO;
export declare const UserInfoDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    username: z.ZodString;
    imageUrl: z.ZodString;
}, "id" | "firstName" | "lastName" | "username" | "imageUrl"> & {
    role: z.ZodOptional<z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
    role?: "ORGANIZER" | "MODERATOR" | "ATTENDEE" | undefined;
}, {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    imageUrl: string;
    role?: "ORGANIZER" | "MODERATOR" | "ATTENDEE" | undefined;
}>;
export type UserInfoDTO = UserContextDTO;
export declare const createUserInfoDTO: typeof createUserContextDTO;

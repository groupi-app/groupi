import { $Enums, Event, Prisma } from '@prisma/client';
declare global {
    interface Window {
        Clerk: any;
    }
}
export type NavItem = {
    title: string;
    href: string;
    disabled?: boolean;
};
export type MainNavItem = NavItem;
export type SettingsNavItem = NavItem;
export type SiteConfig = {
    name: string;
    description: string;
    url: string;
    ogImage: string;
};
export type NavConfig = {
    mainNav: MainNavItem[];
};
export type SettingsNavConfig = {
    settingsNav: SettingsNavItem[];
};
export type HeaderData = Event & {
    userMembership: MembershipWithAvailabilities;
};
export type UserInfo = {
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    username: string | null | undefined;
    imageUrl: string | undefined;
    role?: $Enums.Role | undefined;
    id: string;
};
declare const replyAuthorPost: {
    include: {
        replies: {
            include: {
                author: true;
            };
        };
        author: true;
    };
};
export type ReplyAuthorPost = Prisma.PostGetPayload<typeof replyAuthorPost>;
declare const replyAuthorEventPost: {
    include: {
        replies: {
            include: {
                author: true;
            };
        };
        author: true;
        event: {
            include: {
                memberships: {
                    include: {
                        person: true;
                    };
                };
            };
        };
    };
};
export type ReplyAuthorEventPost = Prisma.PostGetPayload<typeof replyAuthorEventPost>;
declare const member: {
    include: {
        person: true;
    };
};
export type Member = Prisma.MembershipGetPayload<typeof member>;
export type ActionResponse<T> = {
    success?: T;
    error?: string;
};
declare const authorReply: {
    include: {
        author: true;
    };
};
export type AuthorReply = Prisma.ReplyGetPayload<typeof authorReply>;
declare const createdByInvite: {
    include: {
        createdBy: {
            include: {
                person: true;
            };
        };
    };
};
export type CreatedByInvite = Prisma.InviteGetPayload<typeof createdByInvite>;
declare const eventInviteData: {
    include: {
        invites: {
            include: {
                createdBy: {
                    include: {
                        person: true;
                    };
                };
            };
        };
    };
};
export type EventInviteData = Prisma.EventGetPayload<typeof eventInviteData>;
declare const personData: {
    include: {
        memberships: true;
    };
};
export type PersonData = Prisma.PersonGetPayload<typeof personData>;
declare const membershipEventWithMembers: {
    include: {
        event: {
            include: {
                memberships: {
                    include: {
                        person: true;
                    };
                };
            };
        };
    };
};
export type MembershipEventWithMembers = Prisma.MembershipGetPayload<typeof membershipEventWithMembers>;
declare const eventWithMembers: {
    include: {
        memberships: {
            include: {
                person: true;
            };
        };
    };
};
export type EventWithMembers = Prisma.EventGetPayload<typeof eventWithMembers>;
declare const potentialDateTimeWithAvailabilities: {
    include: {
        availabilities: {
            include: {
                membership: {
                    include: {
                        person: true;
                    };
                };
            };
        };
        event: {
            include: {
                memberships: {
                    include: {
                        availabilities: true;
                    };
                };
            };
        };
    };
};
export type PotentialDateTimeWithAvailabilities = Prisma.PotentialDateTimeGetPayload<typeof potentialDateTimeWithAvailabilities>;
declare const membershipWithAvailabilities: {
    include: {
        person: true;
        availabilities: {
            include: {
                potentialDateTime: true;
            };
        };
        event: true;
    };
};
export type MembershipWithAvailabilities = Prisma.MembershipGetPayload<typeof membershipWithAvailabilities>;
declare const notificationWithPersonEventPost: {
    include: {
        person: true;
        event: true;
        post: true;
        author: true;
    };
};
export type NotificationWithPersonEventPost = Prisma.NotificationGetPayload<typeof notificationWithPersonEventPost>;
declare const settingsData: {
    include: {
        notificationMethods: {
            include: {
                notifications: true;
            };
        };
    };
};
export type SettingsData = Prisma.PersonSettingsGetPayload<typeof settingsData>;
export {};

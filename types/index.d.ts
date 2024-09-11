import { $Enums, Event, Person, Post, Reply, Prisma } from "@prisma/client";

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

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
};

export type NavConfig = {
  mainNav: MainNavItem[];
};

export type HeaderData = Event & {
  userRole: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
};

export type UserInfo = {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  username: string | null | undefined;
  avatar: string | undefined;
  role?: $Enums.Role | undefined;
};

const replyAuthorPost = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    replies: {
      include: {
        author: true,
      },
    },
    author: true,
  },
});

export type ReplyAuthorPost = Prisma.PostGetPayload<typeof replyAuthorPost>;

const replyAuthorEventPost = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    replies: {
      include: {
        author: true,
      },
    },
    author: true,
    event: {
      include: {
        memberships: {
          include: {
            person: true,
          },
        },
      },
    },
  },
});

export type ReplyAuthorEventPost = Prisma.PostGetPayload<
  typeof replyAuthorEventPost
>;

const member = Prisma.validator<Prisma.MembershipDefaultArgs>()({
  include: {
    person: true,
  },
});

export type Member = Prisma.MembershipGetPayload<typeof member>;

export type ActionResponse<T> = {
  success?: T;
  error?: string;
};

const authorReply = Prisma.validator<Prisma.ReplyDefaultArgs>()({
  include: {
    author: true,
  },
});

export type AuthorReply = Prisma.ReplyGetPayload<typeof authorReply>;

const createdByInvite = Prisma.validator<Prisma.InviteDefaultArgs>()({
  include: {
    createdBy: {
      include: {
        person: true,
      },
    },
  },
});

export type CreatedByInvite = Prisma.InviteGetPayload<typeof createdByInvite>;

const eventInviteData = Prisma.validator<Prisma.EventDefaultArgs>()({
  include: {
    invites: {
      include: {
        createdBy: {
          include: {
            person: true,
          },
        },
      },
    },
  },
});

export type EventInviteData = Prisma.EventGetPayload<typeof eventInviteData>;

const personData = Prisma.validator<Prisma.PersonDefaultArgs>()({
  include: {
    memberships: true,
  },
});

export type PersonData = Prisma.PersonGetPayload<typeof personData>;

const membershipEventWithMembers =
  Prisma.validator<Prisma.MembershipDefaultArgs>()({
    include: {
      event: {
        include: {
          memberships: {
            include: {
              person: true,
            },
          },
        },
      },
    },
  });

export type MembershipEventWithMembers = Prisma.MembershipGetPayload<
  typeof membershipEventWithMembers
>;

const eventWithMembers = Prisma.validator<Prisma.EventDefaultArgs>()({
  include: {
    memberships: {
      include: {
        person: true,
      },
    },
  },
});

export type EventWithMembers = Prisma.EventGetPayload<typeof eventWithMembers>;

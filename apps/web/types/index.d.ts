import { $Enums, Event, Prisma } from "@prisma/client";

declare global {
  interface Window {
    Clerk: unknown;
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

const potentialDateTimeWithAvailabilities =
  Prisma.validator<Prisma.PotentialDateTimeDefaultArgs>()({
    include: {
      availabilities: {
        include: {
          membership: {
            include: {
              person: true,
            },
          },
        },
      },
      event: {
        include: {
          memberships: {
            include: {
              availabilities: true,
            },
          },
        },
      },
    },
  });

export type PotentialDateTimeWithAvailabilities =
  Prisma.PotentialDateTimeGetPayload<
    typeof potentialDateTimeWithAvailabilities
  >;

const membershipWithAvailabilities =
  Prisma.validator<Prisma.MembershipDefaultArgs>()({
    include: {
      person: true,
      availabilities: {
        include: {
          potentialDateTime: true,
        },
      },
      event: true,
    },
  });

export type MembershipWithAvailabilities = Prisma.MembershipGetPayload<
  typeof membershipWithAvailabilities
>;

const notificationWithPersonEventPost =
  Prisma.validator<Prisma.NotificationDefaultArgs>()({
    include: {
      person: true,
      event: true,
      post: true,
      author: true,
    },
  });

export type NotificationWithPersonEventPost = Prisma.NotificationGetPayload<
  typeof notificationWithPersonEventPost
>;

const settingsData = Prisma.validator<Prisma.PersonSettingsDefaultArgs>()({
  include: {
    notificationMethods: {
      include: {
        notifications: true,
      },
    },
  },
});

export type SettingsData = Prisma.PersonSettingsGetPayload<typeof settingsData>;

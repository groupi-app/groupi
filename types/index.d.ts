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

export type UserInfo = {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  username: string | null | undefined;
  avatar: string | undefined;
  role?: $Enums.Role | undefined;
};

const replyAuthorPost = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    replies: true,
    author: true,
  },
});

export type ReplyAuthorPost = Prisma.PostGetPayload<typeof replyAuthorPost>;

const replyAuthorEventPost = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    replies: true,
    author: true,
    event: true,
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

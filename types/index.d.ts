
import { $Enums, Event, Post, Reply } from "@prisma/client";

declare global {
  interface Window {
    Clerk: any;
  }
}

  export type NavItem = {
    title: string
    href: string
    disabled?: boolean
  }
  
  export type MainNavItem = NavItem
  
  export type SiteConfig = {
    name: string
    description: string
    url: string
    ogImage: string
  }

  export type NavConfig = {
    mainNav: MainNavItem[]
  }

  export type UserInfo = {
    firstName: string | null | undefined
    lastName: string | null | undefined
    username: string | null | undefined
    avatar:string | undefined
    role?: $Enums.Role | undefined
  }

  interface PostWithAuthorInfo extends Post {
    authorInfo?: UserInfo
    event?: Event
    replies: Reply[]
  }

  export type ActionResponse<T> = {
    success?: T
    error?: string
  }

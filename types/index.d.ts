
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
  }

  export type Post = {
    id:string;
    title:string;
    body:string;
    author: UserInfo;
    createdAt:string;
    replies: string;
}
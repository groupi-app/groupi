
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
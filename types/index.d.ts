
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

  export type PersonInfo = {
    displayName: any
    username: string | null | undefined
  }
import { NavConfig } from "@/types"

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "My Events",
      href: "/events",
    },
    {
      title: "New Event",
      href: "/create",
    },
  ],
}

export const profileButtonPopoverStyles = {
  elements: {
    card: 'bg-card dark:border-[1px] dark:border-border',
    userPreviewMainIdentifier: "text-card-foreground font-sans",
    userPreviewSecondaryIdentifier: "text-card-foreground font-sans",
    userButtonPopoverActionButton__signOut: "hover:bg-card-foreground/5 rounded-md",
    userButtonPopoverActionButtonText__signOut: "text-card-foreground font-sans",
    userButtonPopoverActionButtonIcon__signOut: "text-card-foreground font-sans",
    userButtonPopoverActionButton__manageAccount: "hover:bg-card-foreground/5 rounded-md",
    userButtonPopoverActionButtonText__manageAccount: "text-card-foreground font-sans",
    userButtonPopoverActionButtonIcon__manageAccount: "text-card-foreground font-sans",
    userButtonPopoverActions:"px-4",
    userButtonPopoverFooter: "hidden",
  }
}
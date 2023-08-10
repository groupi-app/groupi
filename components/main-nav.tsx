"use client";

import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Suspense } from "react";

import { MainNavItem, UserInfo } from "@/types";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { MobileNav } from "./mobile-nav";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { profileButtonPopoverStyles } from "@/config/clerk";
import { ProfileDropdown } from "./profile-dropdown";

interface MainNavProps {
  items?: MainNavItem[];
  userInfo: UserInfo;
  children?: React.ReactNode;
}

export function MainNav({ items, children, userInfo }: MainNavProps) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);

  return (
    <div className="container flex items-center justify-between h-20 py-6">
      <div className="flex md:gap-10 ">
        <Link href="/" className="items-center hidden space-x-2 md:flex">
          <Icons.logo width="26" height="23" viewBox="0 0 197 225" />
          <span className="hidden text-xl font-bold font-heading sm:inline-block">
            {siteConfig.name}
          </span>
        </Link>
        <SignedIn>
          {items?.length ? (
            <NavigationMenu>
              <NavigationMenuList
                className={"hidden gap-4 font-semibold text-sm md:flex"}
              >
                {items?.map((item, i) => (
                  <NavigationMenuItem key={i}>
                    <NavigationMenuLink
                      className={
                        "px-2 py-2 transition-colors dark:hover:bg-accent rounded-md dark:text-popover-foreground dark:hover:text-accent-foreground hover:bg-accent/10"
                      }
                      href={item.href}
                    >
                      {item.title}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          ) : null}
        </SignedIn>
        <MobileNav userInfo={userInfo} items={items ? items : []} />
      </div>
      <SignedIn>
        <div className="hidden md:block">
          <ProfileDropdown userInfo={userInfo} />
        </div>
      </SignedIn>
      <SignedOut>
        <SignInButton
          className={
            "hidden md:flex px-2 py-2 transition-colors hover:bg-primary-foreground/10 dark:hover:bg-accent rounded-md font-semibold  items-center gap-1 cursor-pointer"
          }
        >
          <div>
            Sign In
            <Icons.signIn className="w-5 h-5" />
          </div>
        </SignInButton>
      </SignedOut>
    </div>
  );
}

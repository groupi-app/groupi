"use client";

import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { MainNavItem } from "@/types";
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
import { ProfileButton } from "./profile-button";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
}

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);

  return (
    <div className="flex h-20 items-center justify-between py-6 container">
      <div className="flex md:gap-10 ">
        <Link href="/" className="hidden items-center space-x-2 md:flex">
          <Icons.logo width="26" height="23" viewBox="0 0 197 225" />
          <span className="hidden font-bold font-heading text-xl sm:inline-block">
            {siteConfig.name}
          </span>
        </Link>
        <SignedIn>
          {items?.length ? (
            <NavigationMenu>
              <NavigationMenuList
                className={"hidden gap-4 font-semibold text-sm md:flex"}
              >
                {items?.map((item) => (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={
                        "px-2 py-2 transition-colors hover:bg-foreground/10 rounded-md"
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
        <MobileNav items={items ? items : []} />
      </div>
      <SignedIn>
        <div className="hidden md:block">
          <ProfileButton />
        </div>
      </SignedIn>
      <SignedOut>
        <SignInButton
          className={
            "hidden md:flex px-2 py-2 transition-colors hover:bg-foreground/10 rounded-md font-semibold  items-center gap-1 cursor-pointer"
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

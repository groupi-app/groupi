import * as React from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { MainNavItem, UserInfo } from "@/types";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { ProfileSlate } from "./profile-slate";
import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Dialog, DialogTrigger } from "./ui/dialog";

interface MobileNavProps {
  userInfo: UserInfo;
  items: MainNavItem[];
  children?: React.ReactNode;
}

export function MobileNav({ items, children, userInfo }: MobileNavProps) {
  return (
      <Sheet className="md:hidden">
        <SheetTrigger className="relative flex items-center justify-center w-12 h-12 transition-colors rounded-md md:hidden hover:bg-foreground/10 text-primary-foreground dark:text-foreground">
          <Icons.menu className="w-8 h-8" />
        </SheetTrigger>
        <SheetContent side="left" className="w-1/2" >
          <SheetHeader>
            <SheetTitle>
              <Link
                className="flex items-center gap-1 text-primary dark:text-foreground"
                href="/"
              >
                <Icons.logo width="26" height="23" viewBox="0 0 197 225" />
                <span>{siteConfig.name}</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <SignedIn>
            <nav className="grid grid-flow-row mt-2 text-sm auto-rows-max">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.disabled ? "#" : item.href}
                  className={cn(
                    "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 transition-colors",
                    item.disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  {item.title}
                </Link>
              ))}
              <div className="mt-6">
                <ProfileSlate userInfo={userInfo} />

                <div className="mt-2">
                  
                  <SignOutButton
                    className={
                      "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 transition-colors"
                    }
                  >
                    Sign Out
                  </SignOutButton>
                </div>
              </div>
            </nav>
          </SignedIn>
          <SignedOut>
            <SignInButton
              className={
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 transition-colors mt-4"
              }
            >
              Sign In
            </SignInButton>
          </SignedOut>
          {children}
        </SheetContent>
      </Sheet>
  );
}

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

import { MainNavItem } from "@/types";
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

interface MobileNavProps {
  items: MainNavItem[];
  children?: React.ReactNode;
}

export function MobileNav({ items, children }: MobileNavProps) {
  return (
    <Sheet className="md:hidden">
      <SheetTrigger className="md:hidden rounded-md w-12 h-12 hover:bg-foreground/10 relative flex justify-center text-primary-foreground dark:text-foreground items-center transition-colors">
        <Icons.menu className="w-8 h-8" />
      </SheetTrigger>
      <SheetContent position="left">
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
          <nav className="grid grid-flow-row auto-rows-max text-sm mt-2">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 hover:text-card-foreground transition-colors",
                  item.disabled && "cursor-not-allowed opacity-60"
                )}
              >
                {item.title}
              </Link>
            ))}
            <div className="mt-6">
              <ProfileSlate />

              <div className="mt-2">
                <Link
                  href={"my-profile"}
                  className={
                    "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 hover:text-card-foreground transition-colors"
                  }
                >
                  My Profile
                </Link>
                <Link
                  href={"settings"}
                  className={
                    "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 hover:text-card-foreground transition-colors"
                  }
                >
                  Settings
                </Link>
                <SignOutButton
                  className={
                    "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 hover:text-card-foreground transition-colors"
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
              "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-card-foreground/10 hover:text-card-foreground transition-colors mt-4"
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

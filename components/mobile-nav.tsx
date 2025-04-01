import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import * as React from "react";

import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { MainNavItem, UserInfo } from "@/types";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { NotificationCount } from "./notification-count";
import { ProfileSlate } from "./profile-slate";
import { useNotificationCloseContext } from "./providers/notif-close-provider";

interface MobileNavProps {
  userInfo: UserInfo;
  items: MainNavItem[];
  children?: React.ReactNode;
}

export function MobileNav({ items, children, userInfo }: MobileNavProps) {
  const { sheetOpen, setSheetOpen } = useNotificationCloseContext();
  return (
    <div className="md:hidden w-full">
      <Sheet modal={false} open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className="flex items-center justify-between">
          <Link href="/">
            <Icons.logo width="36" height="36" viewBox="0 0 197 225" />
          </Link>
          <SheetTrigger className="relative flex items-center justify-center size-12 transition-colors rounded-md md:hidden hover:bg-foreground/5 text-primary-foreground dark:text-foreground">
            {userInfo.id ? (
              <NotificationCount userId={userInfo.id}>
                <Icons.menu className="size-8" />
              </NotificationCount>
            ) : (
              <Icons.menu className="size-8" />
            )}
          </SheetTrigger>
        </div>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>
              <SheetClose asChild>
                <Link
                  className="flex items-center gap-1 text-primary dark:text-foreground"
                  href="/"
                >
                  <Icons.logo width="26" height="23" viewBox="0 0 197 225" />
                  <span>{siteConfig.name}</span>
                </Link>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>

          {userInfo.id && (
            <nav className="grid grid-flow-row mt-2 text-sm auto-rows-max">
              {items.map((item, index) => (
                <SheetClose key={index} asChild>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={cn(
                      "flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground",
                      item.disabled && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {item.title}
                  </Link>
                </SheetClose>
              ))}
              <div className="mt-6">
                <ProfileSlate userInfo={userInfo} />
                <div className="flex flex-col mt-2">
                  <div className="w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer">
                    <SheetClose>
                      <button
                        onClick={() => {
                          window.Clerk.openUserProfile();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Icons.account className="size-4" />
                        <span>My Account</span>
                      </button>
                    </SheetClose>
                  </div>
                  <div className="w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer">
                    <SheetClose>
                      <SignOutButton>
                        <div className="flex items-center gap-2">
                          <Icons.signOut className="size-4" />
                          <span>Sign Out</span>
                        </div>
                      </SignOutButton>
                    </SheetClose>
                  </div>
                </div>
              </div>
            </nav>
          )}

          {!userInfo.id && (
            <SheetClose>
              <SignInButton>
                <div className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer mt-4">
                  <Icons.signIn className="size-4" />
                  <span>Sign In</span>
                </div>
              </SignInButton>
            </SheetClose>
          )}
          {children}
        </SheetContent>
      </Sheet>
    </div>
  );
}

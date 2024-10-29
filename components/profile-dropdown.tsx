"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserInfo } from "@/types";
import { Icons } from "./icons";
import { SignOutButton } from "@clerk/nextjs";
import { getFullName, getInitials } from "@/lib/utils";
import { useState } from "react";
import { set } from "zod";

interface ProfileDropdownProps {
  userInfo: UserInfo;
}

export function ProfileDropdown({ userInfo }: ProfileDropdownProps) {
  const initials = getInitials(userInfo.firstName, userInfo.lastName);

  const fullName = getFullName(userInfo.firstName, userInfo.lastName);

  return (
    <div data-test="profile-dropdown">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="rounded-full">
          <Avatar>
            <AvatarImage src={userInfo.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              {fullName != "" && (
                <span className="text-base text-card-foreground">
                  {fullName}
                </span>
              )}
              <span className="text-muted-foreground">{userInfo.username}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <button
              onClick={() => {
                window.Clerk.openUserProfile();
              }}
              className="flex items-center gap-2 w-full"
            >
              <Icons.account className="w-4 h-4" />
              <span>My Account</span>
            </button>
          </DropdownMenuItem>
          <SignOutButton>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Icons.signOut className="w-4 h-4" />
                <span>Sign Out</span>
              </div>
            </DropdownMenuItem>
          </SignOutButton>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

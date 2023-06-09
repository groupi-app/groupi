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

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
}

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <Icons.logo width="26" height="23" viewBox="0 0 197 225" />
        <span className="hidden font-bold font-heading text-xl sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>

      {items?.length ? (
        <NavigationMenu>
          <NavigationMenuList className={"gap-4 font-semibold text-sm"}>
            {items?.map((item) => (
              <NavigationMenuItem>
                <NavigationMenuLink className={""} href={item.href}>
                  {item.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      ) : null}
    </div>
  );
}

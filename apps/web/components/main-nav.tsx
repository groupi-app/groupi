'use client';

import { Icons } from '@/components/icons';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { siteConfig } from '@/config/site';
import { MainNavItem } from '@/types';
import { SignInButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import * as React from 'react';
import { MobileNav } from './mobile-nav';
import { NotificationsDesktop } from './notifications-desktop';
import { ProfileDropdown } from './profile-dropdown';
import { NotificationCloseContextProvider } from '@/components/providers/notif-close-provider';

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
}

export function MainNav({ items }: MainNavProps) {
  const { user } = useUser();
  return (
    <div className='container flex items-center justify-between h-20 py-6'>
      <NotificationCloseContextProvider>
        <div className='flex md:gap-10 w-full'>
          <Link href='/' className='items-center hidden space-x-2 md:flex'>
            <Icons.logo width='26' height='23' viewBox='0 0 197 225' />
            <span className='hidden text-xl font-bold font-heading sm:inline-block'>
              {siteConfig.name}
            </span>
          </Link>
          {user?.id && items?.length ? (
            <NavigationMenu>
              <NavigationMenuList
                className={'hidden gap-4 font-semibold text-sm md:flex'}
              >
                {items?.map((item, i) => (
                  <NavigationMenuItem key={i}>
                    <NavigationMenuLink
                      className={
                        'px-2 py-2 transition-colors dark:hover:bg-accent rounded-md dark:text-popover-foreground dark:hover:text-accent-foreground hover:bg-accent/10'
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
          <MobileNav
            userInfo={{
              id: user?.id || '',
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              username: user?.username || '',
              imageUrl: user?.imageUrl,
            }}
            items={items ? items : []}
          />
        </div>
        {user?.id && (
          <div className='hidden md:block'>
            <div className='flex items-center gap-3'>
              <NotificationsDesktop userId={user.id} />
              <ProfileDropdown
                userInfo={{
                  id: user.id,
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  username: user.username || '',
                  imageUrl: user.imageUrl,
                }}
              />
            </div>
          </div>
        )}
        {!user?.id && (
          <div
            className={
              'hidden md:block px-2 py-2 transition-colors hover:bg-primary-foreground/10 dark:hover:bg-accent rounded-md font-semibold cursor-pointer'
            }
          >
            <SignInButton>
              <div className='flex items-center gap-1'>
                <span className='whitespace-nowrap'>Sign In</span>
                <Icons.signIn className='size-5' />
              </div>
            </SignInButton>
          </div>
        )}
      </NotificationCloseContextProvider>
    </div>
  );
}

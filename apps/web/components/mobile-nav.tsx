'use client';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import * as React from 'react';

import { Icons } from '@/components/icons';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { MainNavItem } from '@/types';
import { PersonBasicData } from '@groupi/schema';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
// TODO: Re-implement NotificationCount with server actions
import { ProfileSlate } from './profile-slate';
import { useNotificationCloseContext } from '@/components/providers/notif-close-provider';

interface MobileNavProps {
  userInfo: PersonBasicData;
  items: MainNavItem[];
  children?: React.ReactNode;
}

export function MobileNav({ items, children, userInfo }: MobileNavProps) {
  const { sheetOpen, setSheetOpen } = useNotificationCloseContext();
  return (
    <div className='md:hidden w-full'>
      <Sheet modal={false} open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className='flex items-center justify-between'>
          <Link href='/'>
            <Icons.logo width='36' height='36' viewBox='0 0 197 225' />
          </Link>
          <SheetTrigger className='relative flex items-center justify-center size-12 transition-colors rounded-md md:hidden hover:bg-foreground/5 text-primary-foreground dark:text-foreground'>
            <Icons.menu className='size-8' />
            {/* TODO: Re-implement notification count with server actions */}
          </SheetTrigger>
        </div>
        <SheetContent side='top'>
          <SheetHeader>
            <SheetTitle>
              <SheetClose asChild>
                <Link
                  className='flex items-center gap-1 text-primary dark:text-foreground'
                  href='/'
                >
                  <Icons.logo width='26' height='23' viewBox='0 0 197 225' />
                  <span>{siteConfig.name}</span>
                </Link>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>

          {userInfo.id && (
            <nav className='grid grid-flow-row mt-2 text-sm auto-rows-max'>
              {items.map((item, index) => (
                <SheetClose key={index} asChild>
                  <Link
                    href={item.disabled ? '#' : item.href}
                    className={cn(
                      'flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground',
                      item.disabled && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {item.title}
                  </Link>
                </SheetClose>
              ))}
              <div className='mt-6'>
                <ProfileSlate userInfo={userInfo} />
                <div className='flex flex-col mt-2'>
                  <div className='w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer'>
                    <SheetClose asChild>
                      <Link
                        href='/settings'
                        className='flex items-center gap-2'
                      >
                        <Icons.account className='size-4' />
                        <span>My Profile</span>
                      </Link>
                    </SheetClose>
                  </div>
                  <div className='w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer'>
                    <SheetClose asChild>
                      <Link
                        href='/settings'
                        className='flex items-center gap-2'
                      >
                        <Icons.settings className='size-4' />
                        <span>Settings</span>
                      </Link>
                    </SheetClose>
                  </div>
                  <div className='w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer'>
                    <SheetClose asChild>
                      <Button
                        variant='ghost'
                        onClick={() => signOut()}
                        className='w-full justify-start p-0 h-auto'
                      >
                        <div className='flex items-center gap-2'>
                          <Icons.signOut className='size-4' />
                          <span>Sign Out</span>
                        </div>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </div>
            </nav>
          )}

          {!userInfo.id && (
            <SheetClose asChild>
              <Link href='/sign-in'>
                <div className='flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium hover:bg-accent transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer mt-4'>
                  <Icons.signIn className='size-4' />
                  <span>Sign In</span>
                </div>
              </Link>
            </SheetClose>
          )}
          {children}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import { Icons } from '@/components/icons';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ProfileSlate } from './profile-slate';
import { NotificationCount } from './notification-count';
import { useNotificationCloseStore } from '@/stores/notification-close-store';
import { ProfileEditDialog } from './profile-edit-dialog';

// Navigation item type
type NavItem = {
  href: string;
  title: string;
  disabled?: boolean;
};

// User info type
type UserInfo = {
  name?: string;
  email: string;
  username?: string;
  image?: string;
};

export function MobileNav({
  items,
  children,
  userInfo,
}: {
  items: NavItem[];
  children?: React.ReactNode;
  userInfo: UserInfo;
}) {
  const { sheetOpen, setSheetOpen } = useNotificationCloseStore();
  const router = useRouter();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className='md:hidden w-full'>
      <Sheet modal={false} open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className='flex items-center justify-between'>
          <Link href='/' aria-label={`${siteConfig.name} home`}>
            <Icons.logo width='36' height='36' viewBox='0 0 197 225' />
          </Link>
          <SheetTrigger
            aria-label='Open menu'
            className='relative flex items-center justify-center size-12 transition-colors rounded-md md:hidden hover:bg-foreground/5 text-primary-foreground dark:text-foreground'
          >
            <Icons.menu className='size-8' />
            <NotificationCount />
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

          {userInfo.email && (
            <nav className='grid grid-flow-row mt-2 text-sm auto-rows-max'>
              {items.map((item: NavItem, index: number) => (
                <SheetClose key={index} asChild>
                  <Link
                    href={item.disabled ? '#' : item.href}
                    className={cn(
                      'flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground',
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
                  <div className='w-full rounded-md p-2 text-sm font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer'>
                    <button
                      onClick={() => {
                        setSheetOpen(false);
                        setProfileDialogOpen(true);
                      }}
                      className='flex items-center gap-2 w-full'
                    >
                      <Icons.account className='size-4' />
                      <span>My Profile</span>
                    </button>
                  </div>
                  <div className='w-full rounded-md p-2 text-sm font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer'>
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
                  <div className='w-full rounded-md p-2 text-sm font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer'>
                    <SheetClose asChild>
                      <Button
                        variant='ghost'
                        onClick={handleSignOut}
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

          {!userInfo.email && (
            <SheetClose asChild>
              <Link href='/sign-in'>
                <div className='flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground cursor-pointer mt-4'>
                  <Icons.signIn className='size-4' />
                  <span>Sign In</span>
                </div>
              </Link>
            </SheetClose>
          )}
          {children}
        </SheetContent>
      </Sheet>
      <ProfileEditDialog
        userInfo={userInfo}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </div>
  );
}

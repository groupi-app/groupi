import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Icons } from '@/components/icons';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth-client';
import { ProfileSlate } from './profile-slate';
import { CombinedBadgeCount } from './combined-badge-count';
import { useNotificationCloseStore } from '@/stores/notification-close-store';
import { ProfileEditDialog } from './profile-edit-dialog';
import { FriendsDialog } from './friends-dialog';
import { usePendingRequests } from '@/hooks/convex/use-friends';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';
import { Badge } from '@/components/ui/badge';
import { AccountSwitcher, MobileStatusPicker } from '@/components/molecules';

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
  isAdmin = false,
}: {
  items: NavItem[];
  children?: React.ReactNode;
  userInfo: UserInfo;
  isAdmin?: boolean;
}) {
  const { sheetOpen, setSheetOpen } = useNotificationCloseStore();
  const router = useRouter();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const pendingRequests = usePendingRequests();
  const pendingCount = pendingRequests?.length ?? 0;
  const openFriendsDialog = useFriendsDialogStore(state => state.openDialog);

  const handleSignOut = async () => {
    // Navigate to homepage first to prevent auth errors on the current page
    router.push('/');
    // Then sign out and refresh
    await signOut();
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
            <CombinedBadgeCount />
          </SheetTrigger>
        </div>
        <SheetContent side='right' className='w-full sm:w-3/4 sm:max-w-sm'>
          <SheetHeader>
            <SheetTitle>
              <SheetClose asChild>
                <Link
                  className='flex items-center gap-2 text-primary dark:text-foreground'
                  href='/'
                >
                  <Icons.logo width='32' height='28' viewBox='0 0 197 225' />
                  <span className='text-xl'>{siteConfig.name}</span>
                </Link>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>

          {userInfo.email && (
            <nav className='flex flex-col gap-4 mt-6 flex-1 overflow-y-auto'>
              {/* Profile Section */}
              <div className='bg-card rounded-card p-4'>
                <ProfileSlate userInfo={userInfo} />
                <div className='mt-4 border-t border-border/50 pt-4'>
                  <MobileStatusPicker />
                </div>
                <div className='mt-4 border-t border-border/50 pt-4'>
                  <Collapsible
                    open={accountsExpanded}
                    onOpenChange={setAccountsExpanded}
                  >
                    <CollapsibleTrigger className='flex items-center justify-between w-full text-base text-muted-foreground hover:text-foreground transition-colors'>
                      <span>Switch Account</span>
                      <ChevronDown
                        className={cn(
                          'size-5 transition-transform duration-fast',
                          accountsExpanded && 'rotate-180'
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className='pt-3'>
                      <AccountSwitcher
                        onClose={() => {
                          setAccountsExpanded(false);
                          setSheetOpen(false);
                        }}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              {/* Create Button */}
              <SheetClose asChild>
                <Link
                  href='/create'
                  className='flex items-center justify-center gap-2 w-full rounded-button p-4 text-lg font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors'
                >
                  <Icons.plus className='size-6' />
                  <span>Create</span>
                </Link>
              </SheetClose>

              {/* Navigation Links */}
              <div className='bg-card rounded-card overflow-hidden'>
                {items
                  .filter(
                    item =>
                      item.title !== 'My Events' && item.title !== 'New Event'
                  )
                  .map((item: NavItem, index: number, filteredItems) => (
                    <SheetClose key={index} asChild>
                      <Link
                        href={item.disabled ? '#' : item.href}
                        className={cn(
                          'flex w-full items-center p-4 text-lg font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground',
                          item.disabled && 'cursor-not-allowed opacity-60',
                          index < filteredItems.length - 1 &&
                            'border-b border-border/50'
                        )}
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}
              </div>

              {/* Profile Links */}
              <div className='bg-card rounded-card overflow-hidden'>
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    openFriendsDialog();
                  }}
                  className='flex items-center gap-3 w-full p-4 text-lg font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground border-b border-border/50'
                >
                  <Icons.people className='size-6' />
                  <span>Friends</span>
                  {pendingCount > 0 && (
                    <Badge
                      variant='destructive'
                      className='ml-auto size-6 p-0 flex items-center justify-center text-sm'
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    setProfileDialogOpen(true);
                  }}
                  className='flex items-center gap-3 w-full p-4 text-lg font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground border-b border-border/50'
                >
                  <Icons.account className='size-6' />
                  <span>My Profile</span>
                </button>
                <SheetClose asChild>
                  <Link
                    href='/settings'
                    className={cn(
                      'flex items-center gap-3 w-full p-4 text-lg font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground',
                      isAdmin && 'border-b border-border/50'
                    )}
                  >
                    <Icons.settings className='size-6' />
                    <span>Settings</span>
                  </Link>
                </SheetClose>
                {isAdmin && (
                  <SheetClose asChild>
                    <Link
                      href='/admin'
                      className='flex items-center gap-3 w-full p-4 text-lg font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground'
                    >
                      <Icons.shield className='size-6' />
                      <span>Admin</span>
                    </Link>
                  </SheetClose>
                )}
              </div>

              {/* Sign Out */}
              <SheetClose asChild>
                <button
                  onClick={handleSignOut}
                  className='flex items-center justify-center gap-2 w-full rounded-button p-4 text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors'
                >
                  <Icons.signOut className='size-5' />
                  <span>Sign Out</span>
                </button>
              </SheetClose>
            </nav>
          )}

          {!userInfo.email && (
            <SheetClose asChild>
              <Link
                href='/sign-in'
                className='flex items-center gap-3 w-full rounded-button p-4 text-lg font-medium hover:bg-accent/80 transition-colors text-popover-foreground hover:text-accent-foreground mt-6'
              >
                <Icons.signIn className='size-6' />
                <span>Sign In</span>
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

      <FriendsDialog />
    </div>
  );
}

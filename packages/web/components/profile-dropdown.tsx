'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn, getInitialsFromName } from '@/lib/utils';
import { signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { ProfileEditDialog } from '@/components/profile-edit-dialog';
import { FriendsDialog } from '@/components/friends-dialog';
import { usePendingRequests } from '@/hooks/convex/use-friends';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';
import { AccountSwitcher, StatusPicker } from '@/components/molecules';
import { User, ChevronDown } from 'lucide-react';

export function ProfileDropdown({
  userInfo,
}: {
  userInfo: {
    name?: string;
    email: string;
    username?: string;
    image?: string;
  };
}) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const router = useRouter();
  const initials = getInitialsFromName(userInfo.name, userInfo.email);
  const pendingRequests = usePendingRequests();
  const pendingCount = pendingRequests?.length ?? 0;
  const openFriendsDialog = useFriendsDialogStore(state => state.openDialog);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className='h-10' data-test='profile-dropdown'>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className='rounded-full relative cursor-pointer'>
          <Avatar>
            <AvatarImage src={userInfo.image || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {pendingCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs'
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {/* 1. Name and username */}
          <DropdownMenuLabel>
            <div className='flex flex-col'>
              {userInfo.name && (
                <span className='text-base text-card-foreground'>
                  {userInfo.name}
                </span>
              )}
              <span className='text-muted-foreground'>
                {userInfo.username ? `@${userInfo.username}` : userInfo.email}
              </span>
            </div>
          </DropdownMenuLabel>

          {/* 2. Status picker */}
          <StatusPicker />

          {/* 3. Friends */}
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={() => openFriendsDialog()}
          >
            <div className='flex items-center gap-2 w-full'>
              <Icons.people className='size-4' />
              <span>Friends</span>
              {pendingCount > 0 && (
                <Badge
                  variant='destructive'
                  className='ml-auto size-5 p-0 flex items-center justify-center text-xs'
                >
                  {pendingCount}
                </Badge>
              )}
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 4. My Profile */}
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={() => setProfileDialogOpen(true)}
          >
            <div className='flex items-center gap-2 w-full'>
              <User className='size-4' />
              <span>My Profile</span>
            </div>
          </DropdownMenuItem>

          {/* 5. Settings */}
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href='/settings' className='flex items-center gap-2 w-full'>
              <Icons.settings className='size-4' />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 6. Switch Account (collapsible) */}
          <div className='px-2 py-1'>
            <Collapsible
              open={accountsExpanded}
              onOpenChange={setAccountsExpanded}
            >
              <CollapsibleTrigger className='flex items-center justify-between w-full py-1 text-sm text-muted-foreground hover:text-foreground transition-colors'>
                <span>Switch Account</span>
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform duration-fast',
                    accountsExpanded && 'rotate-180'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className='pt-2'>
                <AccountSwitcher onClose={() => setAccountsExpanded(false)} />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* 7. Sign Out */}
          <DropdownMenuItem className='cursor-pointer' onClick={handleSignOut}>
            <div className='flex items-center gap-2'>
              <Icons.signOut className='size-4' />
              <span>Sign Out</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileEditDialog
        userInfo={userInfo}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />

      <FriendsDialog />
    </div>
  );
}

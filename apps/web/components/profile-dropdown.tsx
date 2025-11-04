'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitialsFromName } from '@/lib/utils';
import { PersonBasicData } from '@groupi/schema';
import { signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { ProfileEditDialog } from '@/components/profile-edit-dialog';
import { User } from 'lucide-react';
// TODO: Migrate profile functionality to server actions

interface ProfileDropdownProps {
  userInfo: PersonBasicData & {
    imageKey?: string | null;
    pronouns?: string | null;
    bio?: string | null;
  };
}

export function ProfileDropdown({ userInfo }: ProfileDropdownProps) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const initials = getInitialsFromName(userInfo.name, userInfo.email);

  // TODO: Migrate to server actions
  // Using userInfo directly for now since trpc is not available
  const completeUserInfo = userInfo;

  return (
    <div className='h-10' data-test='profile-dropdown'>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className='rounded-full'>
          <Avatar>
            <AvatarImage src={userInfo.image || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>
            <div className='flex flex-col'>
              {completeUserInfo.name && (
                <span className='text-base text-card-foreground'>
                  {completeUserInfo.name}
                </span>
              )}
              <span className='text-muted-foreground'>
                {completeUserInfo.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='cursor-pointer'
            onSelect={() => setProfileDialogOpen(true)}
          >
            <div className='flex items-center gap-2 w-full'>
              <User className='size-4' />
              <span>My Profile</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href='/settings' className='flex items-center gap-2 w-full'>
              <Icons.settings className='size-4' />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className='cursor-pointer'
            onClick={() => signOut()}
          >
            <div className='flex items-center gap-2'>
              <Icons.signOut className='size-4' />
              <span>Sign Out</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileEditDialog
        userInfo={completeUserInfo}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </div>
  );
}

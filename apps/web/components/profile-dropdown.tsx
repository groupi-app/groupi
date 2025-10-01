'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFullName, getInitials } from '@/lib/utils';
import { UserInfo } from '@/types';
import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Icons } from '@/components/icons';

interface ProfileDropdownProps {
  userInfo: UserInfo;
}

export function ProfileDropdown({ userInfo }: ProfileDropdownProps) {
  const initials = getInitials(userInfo.firstName, userInfo.lastName);

  const fullName = getFullName(userInfo.firstName, userInfo.lastName);

  return (
    <div className='h-10' data-test='profile-dropdown'>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className='rounded-full'>
          <Avatar>
            <AvatarImage src={userInfo.imageUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>
            <div className='flex flex-col'>
              {fullName != '' && (
                <span className='text-base text-card-foreground'>
                  {fullName}
                </span>
              )}
              <span className='text-muted-foreground'>{userInfo.username}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className='cursor-pointer'>
            <button
              onClick={() => {
                (window as any).Clerk?.openUserProfile();
              }}
              className='flex items-center gap-2 w-full'
            >
              <Icons.account className='size-4' />
              <span>My Account</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href='/settings' className='flex items-center gap-2 w-full'>
              <Icons.settings className='size-4' />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <SignOutButton>
            <DropdownMenuItem className='cursor-pointer'>
              <div className='flex items-center gap-2'>
                <Icons.signOut className='size-4' />
                <span>Sign Out</span>
              </div>
            </DropdownMenuItem>
          </SignOutButton>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

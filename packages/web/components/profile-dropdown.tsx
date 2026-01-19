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
import { getInitialsFromName } from '@/lib/utils';
import { signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { ProfileEditDialog } from '@/components/profile-edit-dialog';
import { User } from 'lucide-react';

export function ProfileDropdown({ userInfo }: {
  userInfo: {
    name?: string;
    email: string;
    username?: string;
    image?: string;
  };
}) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const router = useRouter();
  const initials = getInitialsFromName(userInfo.name, userInfo.email);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

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
              {userInfo.name && (
                <span className='text-base text-card-foreground'>
                  {userInfo.name}
                </span>
              )}
              <span className='text-muted-foreground'>
                {userInfo.username
                  ? `@${userInfo.username}`
                  : userInfo.email}
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
    </div>
  );
}

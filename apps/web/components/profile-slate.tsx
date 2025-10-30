'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { PersonBasicDTO } from '@groupi/schema';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { NotificationCount } from './notification-count';
import { NotificationWidget } from './notification-widget';
import { Button } from '@/components/ui/button';

interface ProfileSlateProps {
  userInfo: PersonBasicDTO;
}

export function ProfileSlate({ userInfo }: ProfileSlateProps) {
  const [open, setOpen] = useState(false);

  const initials = getInitialsFromName(userInfo.name, userInfo.email);

  return (
    <div>
      <div className='flex items-center gap-3'>
        <Avatar>
          <AvatarImage src={userInfo.image || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col items-start'>
          {userInfo.name && (
            <span className='text-base text-card-foreground'>
              {userInfo.name}
            </span>
          )}
          <span className='text-muted-foreground'>{userInfo.email}</span>
        </div>
        <div>
          <Button
            onClick={() => {
              setOpen(!open);
            }}
            size='icon'
            variant='ghost'
            className='rounded-full'
          >
            <NotificationCount userId={userInfo.id}>
              <Icons.bell className='size-5' />
            </NotificationCount>
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='overflow-hidden p-2'
          >
            <NotificationWidget userId={userInfo.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

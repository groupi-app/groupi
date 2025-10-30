'use client';

import { Icons } from '@/components/icons';
import { NotificationCount } from './notification-count';
import { NotificationWidget } from './notification-widget';
import { useNotificationCloseContext } from '@/components/providers/notif-close-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function NotificationsDesktop({ userId }: { userId: string }) {
  const { popoverOpen, setPopoverOpen } = useNotificationCloseContext();

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size='icon' variant='ghost' className='rounded-full'>
          <NotificationCount userId={userId}>
            <Icons.bell className='size-5' />
          </NotificationCount>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end'>
        <NotificationWidget userId={userId} />
      </PopoverContent>
    </Popover>
  );
}

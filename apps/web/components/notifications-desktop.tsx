'use client';

import { Icons } from '@/components/icons';
import { useNotificationCloseStore } from '@/stores/notification-close-store';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationWidget } from './notification-widget';
import { NotificationCount } from './notification-count';

export function NotificationsDesktop() {
  const { popoverOpen, setPopoverOpen } = useNotificationCloseStore();

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size='icon' variant='ghost' className='rounded-full relative'>
          <Icons.bell className='size-5' />
          <NotificationCount />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <NotificationWidget maxHeight='500px' />
      </PopoverContent>
    </Popover>
  );
}

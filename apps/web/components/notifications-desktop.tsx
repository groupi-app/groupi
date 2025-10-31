'use client';

import { Icons } from '@/components/icons';
// TODO: Re-implement notification components with server actions
import { useNotificationCloseContext } from '@/components/providers/notif-close-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function NotificationsDesktop() {
  const { popoverOpen, setPopoverOpen } = useNotificationCloseContext();

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size='icon' variant='ghost' className='rounded-full'>
          <Icons.bell className='size-5' />
          {/* TODO: Re-implement NotificationCount */}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end'>
        <div className='p-4 text-sm text-muted-foreground'>
          Notifications temporarily disabled during migration
        </div>
        {/* TODO: Re-implement NotificationWidget */}
      </PopoverContent>
    </Popover>
  );
}

import { Icons } from './icons';
import { NotificationCount } from './notification-count';
import { NotificationWidget } from './notification-widget';
import { useNotificationCloseContext } from './providers/notif-close-provider';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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

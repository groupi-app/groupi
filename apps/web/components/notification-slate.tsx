import {
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
} from '@groupi/hooks';
import { formatDate } from '@/lib/utils';
import type { NotificationFeedDTO } from '@groupi/schema';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useNotificationCloseContext } from '@/components/providers/notif-close-provider';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function NotificationSlate({
  notification,
}: {
  notification: NotificationFeedDTO;
}) {
  const { createdAt, type, read } = notification;

  // tRPC hooks for notification actions
  const { markAsRead } = useMarkNotificationAsRead();
  const { mutate: markUnreadMutate } = useMarkNotificationAsUnread();
  const { setPopoverOpen, setSheetOpen } = useNotificationCloseContext();
  const closeMenus = () => {
    setPopoverOpen(false);
    setSheetOpen(false);
  };

  const getNotificationLink = () => '#';

  const getNotificationMessage = () => ({ __html: `${type} notification` });

  return (
    <div className='relative'>
      <Link
        onClick={() => {
          closeMenus();
        }}
        href={getNotificationLink()}
        className='hover:bg-accent flex items-center text-card-foreground gap-3 p-2 pr-10 transition-all'
      >
        {!read && <div className='size 2 rounded-full bg-primary p-1' />}
        <div className='flex flex-col gap-1'>
          <p
            dangerouslySetInnerHTML={getNotificationMessage()}
            className='text-sm'
          ></p>
          <span className='text-xs text-muted-foreground'>
            {formatDate(createdAt)}
          </span>
        </div>
      </Link>

      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className='size-8 absolute right-2 top-0 bottom-0 my-auto'
              size='icon'
              variant='ghost'
            >
              <Icons.more />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className=''>
            {read ? (
              <DropdownMenuItem
                onClick={() => {
                  markUnreadMutate(
                    { notificationId: notification.id },
                    {
                      onError: () => {
                        toast.error('An error occurred', {
                          description:
                            'There was a problem marking this notification as unread.',
                        });
                      },
                    }
                  );
                }}
                className='cursor-pointer'
                asChild
              >
                <div className='flex items-center gap-1'>
                  <Icons.unread className='size-4' />
                  <span>Mark as unread</span>
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  markAsRead(notification.id, {
                    onError: () => {
                      toast.error('An error occurred', {
                        description:
                          'There was a problem marking this notification as read.',
                      });
                    },
                  });
                }}
                className='cursor-pointer'
                asChild
              >
                <div className='flex items-center gap-1'>
                  <Icons.read className='size-4' />
                  <span>Mark as read</span>
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              asChild
              className='focus:bg-destructive focus:text-destructive-foreground cursor-pointer'
            >
              <div className='flex items-center gap-1'>
                <Icons.delete className='size-4' />
                <span>Delete</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Dialog>
    </div>
  );
}

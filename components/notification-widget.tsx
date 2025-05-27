import { useNotifications } from '@/data/notification-hooks';
import {
  deleteAllNotifications,
  markAllNotificationsAsRead,
} from '@/lib/actions/notification';
import { cn } from '@/lib/utils';
import { NotificationWithPersonEventPost } from '@/types';
import { useState } from 'react';
import { Icons } from './icons';
import { NotificationSlate } from './notification-slate';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from './ui/use-toast';

export function NotificationWidget({ userId }: { userId: string }) {
  const [dialogType, setDialogType] = useState<
    'mark-all-as-read' | 'delete-all'
  >('mark-all-as-read');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { toast } = useToast();

  const { data: notificationData } = useNotifications(userId);

  const {
    notifications,
  }: { notifications: NotificationWithPersonEventPost[] } = notificationData;

  const filtered = (notification: NotificationWithPersonEventPost) => {
    if (filter === 'unread') {
      return !notification.read;
    }
    return true;
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex item-center gap-4'>
        <h1 className='text-card-foreground font-semibold text-xl flex items-center'>
          Notifications
        </h1>
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost'>
                <Icons.more />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DialogTrigger asChild>
                <DropdownMenuItem asChild className='cursor-pointer'>
                  <div
                    onClick={() => {
                      setDialogType('mark-all-as-read');
                    }}
                    className='flex items-center gap-1'
                  >
                    <Icons.read className='size-4' />
                    <span>Mark all as read</span>
                  </div>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className='focus:text-destructive-foreground focus:bg-destructive cursor-pointer'
                  asChild
                >
                  <div
                    onClick={() => {
                      setDialogType('delete-all');
                    }}
                    className='flex items-center gap-1'
                  >
                    <Icons.delete className='size-4' />
                    <span>Delete All</span>
                  </div>
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          {dialogType === 'mark-all-as-read' ? (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark all as read</DialogTitle>
                <DialogDescription>
                  Are you sure you want to mark all notifications as read?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='ghost'>Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={async () => {
                      const res = await markAllNotificationsAsRead();
                      if (res.error) {
                        toast({
                          title: 'An error occurred',
                          description:
                            'There was a problem marking the notifications as read.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          ) : (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete All</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete all notifications?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='ghost'>Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={async () => {
                      const res = await deleteAllNotifications();
                      if (res.error) {
                        toast({
                          title: 'An error occurred',
                          description:
                            'There was a problem deleting notifications.',
                        });
                      }
                    }}
                    variant='destructive'
                  >
                    Delete
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
      <div className='flex items-center gap-4'>
        <div className='flex items-center'>
          <Button
            size='sm'
            className={cn(
              'rounded-r-none h-10',
              filter === 'all' && 'bg-accent text-accent-foreground'
            )}
            variant='outline'
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            size='sm'
            className={cn(
              'rounded-l-none h-10',
              filter === 'unread' && 'bg-accent text-accent-foreground'
            )}
            variant='outline'
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
        </div>
        <div className='flex items-center gap-2'></div>
      </div>
      <ScrollArea className='h-64 p-1'>
        <div className='divide-y'>
          {notifications
            ?.filter(filtered)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(notification => (
              <NotificationSlate
                key={notification.id}
                notification={notification}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

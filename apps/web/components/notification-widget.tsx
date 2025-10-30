'use client';
import { useNotifications, useMarkAllNotificationsAsRead } from '@groupi/hooks';
import { cn } from '@/lib/utils';
import type { NotificationFeedDTO } from '@groupi/schema';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { NotificationSlate } from './notification-slate';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export function NotificationWidget({ userId }: { userId: string }) {
  const [dialogType, setDialogType] = useState<
    'mark-all-as-read' | 'delete-all'
  >('mark-all-as-read');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useNotifications(userId);
  const markAllAsRead = useMarkAllNotificationsAsRead(userId);
  // delete all not implemented in new API; button will show dialog but disabled

  if (isLoading || !data) {
    return <div>Loading notifications...</div>;
  }

  const [error, notificationData] = data;

  if (error) {
    const errorTag = '_tag' in error ? error._tag : null;
    switch (errorTag) {
      case 'NotFoundError':
        return <div>Notifications not found</div>;
      case 'UnauthorizedError':
        return <div>You are not authorized to view notifications</div>;
      case 'DatabaseError':
      case 'ConnectionError':
      default:
        return <div>Error loading notifications</div>;
    }
  }

  // If error is null, notificationData is guaranteed to exist

  const notifications =
    (notificationData as unknown as NotificationFeedDTO[]) || [];

  const filtered = (notification: NotificationFeedDTO) => {
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
                    onClick={() => {
                      markAllAsRead.mutate(undefined, {
                        onError: _error => {
                          toast.error(
                            'There was a problem marking the notifications as read.'
                          );
                        },
                        onSuccess: () => {
                          toast.success('All notifications marked as read');
                        },
                      });
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
                  <Button disabled variant='destructive'>
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
            .sort(
              (a: NotificationFeedDTO, b: NotificationFeedDTO) =>
                b.createdAt.getTime() - a.createdAt.getTime()
            )
            .map((notification: NotificationFeedDTO) => (
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

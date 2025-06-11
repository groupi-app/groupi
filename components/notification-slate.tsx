import {
  deleteNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
} from '@/lib/actions/notification';
import { formatDate } from '@/lib/utils';
import { NotificationWithPersonEventPost } from '@/types';
import Link from 'next/link';
import { Icons } from './icons';
import { useNotificationCloseContext } from './providers/notif-close-provider';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';

export function NotificationSlate({
  notification,
}: {
  notification: NotificationWithPersonEventPost;
}) {
  const { event, post, createdAt, type, read, datetime, author, rsvp } =
    notification;
  const { setPopoverOpen, setSheetOpen } = useNotificationCloseContext();
  const closeMenus = () => {
    setPopoverOpen(false);
    setSheetOpen(false);
  };

  const getNotificationLink = () => {
    switch (type) {
      case 'EVENT_EDITED':
      case 'DATE_CHANGED':
      case 'DATE_CHOSEN':
      case 'DATE_RESET':
      case 'USER_JOINED':
      case 'USER_LEFT':
      case 'USER_PROMOTED':
      case 'USER_DEMOTED':
      case 'USER_RSVP':
        return `/event/${event?.id}`;
      case 'NEW_POST':
      case 'NEW_REPLY':
        return `/post/${post?.id}`;
      //default
      default:
        return `/event/${event?.id}`;
    }
  };

  const getNotificationMessage = () => {
    switch (type) {
      case 'EVENT_EDITED':
        return {
          __html: `The details of <strong>${event?.title}</strong> have been updated.`,
        };
      case 'DATE_CHANGED':
        if (!datetime) throw new Error('Datetime not found');
        return {
          __html: `The date of <strong>${
            event?.title
          }</strong> has changed to <strong>${datetime?.toLocaleString([], {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })}</strong>.`,
        };
      case 'DATE_CHOSEN':
        if (!datetime) throw new Error('Datetime not found');
        return {
          __html: `<strong>${
            event?.title
          }</strong> will be held on <strong>${datetime?.toLocaleString([], {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })}</strong>.`,
        };
      case 'DATE_RESET':
        return {
          __html: `A new poll has started for the date of <strong>${event?.title}</strong>.`,
        };
      case 'NEW_POST':
        if (!author) throw new Error('Author not found');
        return {
          __html: `<strong>${
            author.firstName ?? author.lastName ?? author.username
          }</strong> created a new post, <strong>${post?.title}</strong>, in <strong>${
            event?.title
          }</strong>.`,
        };
      case 'NEW_REPLY':
        if (!author) throw new Error('Author not found');
        return {
          __html: `<strong>${
            author.firstName ?? author.lastName ?? author.username
          }</strong> replied to a post, <strong>${post?.title}</strong>, in <strong>${
            event?.title
          }</strong>.`,
        };
      case 'USER_JOINED':
        if (!author) throw new Error('Author not found');
        return {
          __html: `<strong>${
            author.firstName ?? author.lastName ?? author.username
          }</strong> has joined <strong>${event?.title}</strong>.`,
        };
      case 'USER_LEFT':
        if (!author) throw new Error('Author not found');
        return {
          __html: `<strong>${
            author.firstName ?? author.lastName ?? author.username
          }</strong> has left <strong>${event?.title}</strong>.`,
        };
      case 'USER_PROMOTED':
        return {
          __html: `You are now a Moderator of <strong>${event?.title}</strong>.`,
        };
      case 'USER_DEMOTED':
        return {
          __html: `You are no longer a Moderator of <strong>${event?.title}</strong>.`,
        };
      case 'USER_RSVP':
        if (!author) throw new Error('Author not found');
        return {
          __html: `<strong>${
            author.firstName ?? author.lastName ?? author.username
          }</strong> has RSVP'd <strong>${rsvp}</strong> to <strong>${event?.title}</strong>.`,
        };
    }
  };

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
                onClick={async () => {
                  const res = await markNotificationAsUnread(notification.id);
                  if (res.error) {
                    toast.error('An error occurred', {
                      description:
                        'There was a problem marking this notification as unread.',
                    });
                  }
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
                onClick={async () => {
                  const res = await markNotificationAsRead(notification.id);
                  if (res.error) {
                    toast.error('An error occurred', {
                      description:
                        'There was a problem marking this notification as read.',
                    });
                  }
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
              onClick={async () => {
                const res = await deleteNotification(notification.id);
                if (res.error) {
                  toast.error('An error occurred', {
                    description:
                      'There was a problem deleting this notification.',
                  });
                }
              }}
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

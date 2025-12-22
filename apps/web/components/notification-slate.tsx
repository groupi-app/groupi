'use client';

import {
  markNotificationAsReadAction,
  markNotificationAsUnreadAction,
  deleteNotificationAction,
} from '@/actions/notification-actions';
import { formatDate } from '@/lib/utils';
import type { NotificationFeedData } from '@groupi/schema';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useNotificationCloseStore } from '@/stores/notification-close-store';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { toast } from 'sonner';

export function NotificationSlate({
  notification,
}: {
  notification: NotificationFeedData;
}) {
  const { createdAt, type, read, event, post } = notification;
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu,
    handleClick,
    handleMoreClick,
    isMobile,
  } = useActionMenu();

  const { setPopoverOpen, setSheetOpen: setNotificationSheetOpen } =
    useNotificationCloseStore();
  const closeMenus = () => {
    setPopoverOpen(false);
    setNotificationSheetOpen(false);
  };

  const getNotificationLink = (): string => {
    if (!event) return '/';

    const eventId = event.id;

    switch (type) {
      case 'EVENT_EDITED':
      case 'DATE_CHOSEN':
      case 'DATE_CHANGED':
      case 'DATE_RESET':
      case 'USER_PROMOTED':
      case 'USER_DEMOTED':
      case 'USER_JOINED':
      case 'USER_LEFT':
      case 'USER_RSVP':
        return `/event/${eventId}`;

      case 'NEW_POST':
        if (post) {
          return `/post/${post.id}`;
        }
        return `/event/${eventId}`;

      case 'NEW_REPLY':
        if (post) {
          return `/post/${post.id}`;
        }
        return `/event/${eventId}`;

      case 'USER_MENTIONED':
        if (post) {
          return `/post/${post.id}`;
        }
        return `/event/${eventId}`;

      default:
        return `/event/${eventId}`;
    }
  };

  const getNotificationMessage = () => {
    const { type, event, post, author, rsvp } = notification;

    // Helper to get author name
    const getAuthorName = () => {
      if (!author?.user) return 'Someone';
      return author.user.name || author.user.email?.split('@')[0] || 'Someone';
    };

    const authorName = getAuthorName();
    const eventTitle = event?.title || 'Event';
    const postTitle = post?.title || 'Post';

    switch (type) {
      case 'EVENT_EDITED':
        return (
          <>
            Event Updated: <strong>{eventTitle}</strong>
          </>
        );

      case 'DATE_CHOSEN':
        return (
          <>
            Date Set for <strong>{eventTitle}</strong>
          </>
        );

      case 'DATE_CHANGED':
        return (
          <>
            Date Changed for <strong>{eventTitle}</strong>
          </>
        );

      case 'DATE_RESET':
        return (
          <>
            New Date Poll for <strong>{eventTitle}</strong>
          </>
        );

      case 'NEW_POST':
        return (
          <>
            New Post in <strong>{eventTitle}</strong>:{' '}
            <strong>{postTitle}</strong>
          </>
        );

      case 'NEW_REPLY':
        return (
          <>
            New Reply to <strong>{postTitle}</strong>
          </>
        );

      case 'USER_MENTIONED':
        return (
          <>
            <strong>{authorName}</strong> mentioned you in{' '}
            <strong>{postTitle}</strong>
          </>
        );

      case 'USER_JOINED':
        return (
          <>
            <strong>{authorName}</strong> Joined <strong>{eventTitle}</strong>
          </>
        );

      case 'USER_LEFT':
        return (
          <>
            <strong>{authorName}</strong> Left <strong>{eventTitle}</strong>
          </>
        );

      case 'USER_PROMOTED':
        return (
          <>
            You&apos;re Now a Moderator of <strong>{eventTitle}</strong>
          </>
        );

      case 'USER_DEMOTED':
        return (
          <>
            Moderator Status Removed for <strong>{eventTitle}</strong>
          </>
        );

      case 'USER_RSVP': {
        const rsvpStatus = rsvp ? rsvp.toLowerCase() : 'responded';
        return (
          <>
            <strong>{authorName}</strong> RSVP&apos;d {rsvpStatus} to{' '}
            <strong>{eventTitle}</strong>
          </>
        );
      }

      default:
        return (
          <>
            Notification from <strong>{eventTitle}</strong>
          </>
        );
    }
  };

  // Drawer content for mobile
  const drawerContent = (
    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
      {read ? (
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={async () => {
            setSheetOpen(false);
            const [error] = await markNotificationAsUnreadAction({
              notificationId: notification.id,
            });
            if (error) {
              toast.error('An error occurred', {
                description:
                  'There was a problem marking this notification as unread.',
              });
            }
          }}
        >
          <Icons.unread className='size-4 mr-2' />
          Mark as unread
        </Button>
      ) : (
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={async () => {
            setSheetOpen(false);
            const [error] = await markNotificationAsReadAction({
              notificationId: notification.id,
            });
            if (error) {
              toast.error('An error occurred', {
                description:
                  'There was a problem marking this notification as read.',
              });
            }
          }}
        >
          <Icons.read className='size-4 mr-2' />
          Mark as read
        </Button>
      )}
      <Button
        variant='ghost'
        className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
        onClick={async () => {
          setSheetOpen(false);
          const [error] = await deleteNotificationAction({
            notificationId: notification.id,
          });
          if (error) {
            toast.error('An error occurred', {
              description: 'There was a problem deleting this notification.',
            });
          } else {
            toast.success('Notification deleted');
          }
        }}
      >
        <Icons.delete className='size-4 mr-2' />
        Delete
      </Button>
    </div>
  );

  // Context menu content for desktop
  const contextMenuContent = (
    <>
      {read ? (
        <ContextMenuItem
          onClick={async () => {
            const [error] = await markNotificationAsUnreadAction({
              notificationId: notification.id,
            });
            if (error) {
              toast.error('An error occurred', {
                description:
                  'There was a problem marking this notification as unread.',
              });
            }
          }}
          className='cursor-pointer'
        >
          <div className='flex items-center gap-1'>
            <Icons.unread className='size-4' />
            <span>Mark as unread</span>
          </div>
        </ContextMenuItem>
      ) : (
        <ContextMenuItem
          onClick={async () => {
            const [error] = await markNotificationAsReadAction({
              notificationId: notification.id,
            });
            if (error) {
              toast.error('An error occurred', {
                description:
                  'There was a problem marking this notification as read.',
              });
            }
          }}
          className='cursor-pointer'
        >
          <div className='flex items-center gap-1'>
            <Icons.read className='size-4' />
            <span>Mark as read</span>
          </div>
        </ContextMenuItem>
      )}
      <ContextMenuItem
        onSelect={async e => {
          e.preventDefault();
          const [error] = await deleteNotificationAction({
            notificationId: notification.id,
          });
          if (error) {
            toast.error('An error occurred', {
              description: 'There was a problem deleting this notification.',
            });
          } else {
            toast.success('Notification deleted');
          }
        }}
        className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
      >
        <div className='flex items-center gap-1'>
          <Icons.delete className='size-4' />
          <span>Delete</span>
        </div>
      </ContextMenuItem>
    </>
  );

  // Dropdown menu content for desktop
  const dropdownContent = (
    <>
      {read ? (
        <DropdownMenuItem
          onClick={async () => {
            const [error] = await markNotificationAsUnreadAction({
              notificationId: notification.id,
            });
            if (error) {
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
            const [error] = await markNotificationAsReadAction({
              notificationId: notification.id,
            });
            if (error) {
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
          const [error] = await deleteNotificationAction({
            notificationId: notification.id,
          });
          if (error) {
            toast.error('An error occurred', {
              description: 'There was a problem deleting this notification.',
            });
          } else {
            toast.success('Notification deleted');
          }
        }}
        className='focus:bg-destructive focus:text-destructive-foreground cursor-pointer'
      >
        <div className='flex items-center gap-1'>
          <Icons.delete className='size-4' />
          <span>Delete</span>
        </div>
      </DropdownMenuItem>
    </>
  );

  const notificationContent = (
    <div className='relative group'>
      <Link
        onClick={() => {
          closeMenus();
        }}
        href={getNotificationLink()}
        className='hover:bg-accent flex items-center text-card-foreground gap-3 p-2 pr-10 transition-all'
      >
        {!read && <div className='size-2 rounded-full bg-primary' />}
        <div className='flex flex-col gap-1 px-2'>
          <p className='text-sm'>{getNotificationMessage()}</p>
          <span className='text-xs text-muted-foreground'>
            {formatDate(createdAt)}
          </span>
        </div>
      </Link>

      <ActionMenuButton
        onClick={handleMoreClick}
        onContextMenu={handleContextMenu}
        className={`size-8 absolute right-2 top-0 bottom-0 my-auto ${
          isMobile ? '' : 'opacity-0 group-hover:opacity-100'
        }`}
        dropdownContent={dropdownContent}
      >
        <Icons.more />
      </ActionMenuButton>
    </div>
  );

  return (
    <ActionMenu
      drawerTitle='Notification Options'
      drawerContent={drawerContent}
      contextMenuContent={contextMenuContent}
      sheetOpen={sheetOpen}
      onSheetOpenChange={setSheetOpen}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {notificationContent}
    </ActionMenu>
  );
}

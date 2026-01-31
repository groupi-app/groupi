import { useMutation } from 'convex/react';
import { formatDate } from '@/lib/utils';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let notificationMutations: any;
function initApi() {
  if (!notificationMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('../../../convex/_generated/api');
    notificationMutations = api.notifications?.mutations ?? {};
  }
}
initApi();
import { Doc, Id } from '@/convex/_generated/dataModel';
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

// Extended notification type with joined event/post/author data
interface EnrichedNotification extends Doc<'notifications'> {
  id: string; // Alias for _id
  createdAt: number; // Alias for _creationTime
  event?: { id: string; title: string };
  post?: { id: string; title: string };
  author?: { user?: { name?: string; email?: string } };
}

export function NotificationSlate({
  notification,
}: {
  notification: EnrichedNotification;
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

  // Convex mutations
  const markAsRead = useMutation(notificationMutations.markNotificationAsRead);
  const markAsUnread = useMutation(
    notificationMutations.markNotificationAsUnread
  );
  const deleteNotification = useMutation(
    notificationMutations.deleteNotification
  );

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
          return `/event/${eventId}/post/${post.id}`;
        }
        return `/event/${eventId}`;

      case 'NEW_REPLY':
        if (post) {
          return `/event/${eventId}/post/${post.id}`;
        }
        return `/event/${eventId}`;

      case 'USER_MENTIONED':
        if (post) {
          return `/event/${eventId}/post/${post.id}`;
        }
        return `/event/${eventId}`;

      case 'EVENT_REMINDER':
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
            <strong>{authorName}</strong> posted in{' '}
            <strong>{eventTitle}</strong>: <strong>{postTitle}</strong>
          </>
        );

      case 'NEW_REPLY':
        return (
          <>
            <strong>{authorName}</strong> replied to{' '}
            <strong>{postTitle}</strong>
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

      case 'EVENT_REMINDER': {
        const { datetime } = notification;
        const formattedTime = datetime ? formatDate(datetime) : 'soon';
        return (
          <>
            Reminder: <strong>{eventTitle}</strong> is starting {formattedTime}
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
            try {
              await markAsUnread({
                notificationId: notification.id as Id<'notifications'>,
              });
              toast.success('Notification marked as unread');
            } catch {
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
            try {
              await markAsRead({
                notificationId: notification.id as Id<'notifications'>,
              });
              toast.success('Notification marked as read');
            } catch {
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
          try {
            await deleteNotification({
              notificationId: notification.id as Id<'notifications'>,
            });
            toast.success('Notification deleted');
          } catch {
            toast.error('An error occurred', {
              description: 'There was a problem deleting this notification.',
            });
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
            try {
              await markAsUnread({
                notificationId: notification.id as Id<'notifications'>,
              });
              toast.success('Notification marked as unread');
            } catch {
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
            try {
              await markAsRead({
                notificationId: notification.id as Id<'notifications'>,
              });
              toast.success('Notification marked as read');
            } catch {
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
          try {
            await deleteNotification({
              notificationId: notification.id as Id<'notifications'>,
            });
            toast.success('Notification deleted');
          } catch {
            toast.error('An error occurred', {
              description: 'There was a problem deleting this notification.',
            });
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
            try {
              await markAsUnread({
                notificationId: notification.id as Id<'notifications'>,
              });
              toast.success('Notification marked as unread');
            } catch {
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
            try {
              await markAsRead({
                notificationId: notification.id as Id<'notifications'>,
              });
              toast.success('Notification marked as read');
            } catch {
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
          try {
            await deleteNotification({
              notificationId: notification.id as Id<'notifications'>,
            });
            toast.success('Notification deleted');
          } catch {
            toast.error('An error occurred', {
              description: 'There was a problem deleting this notification.',
            });
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
        onClick={async () => {
          closeMenus();
          // Mark as read when clicking to navigate
          if (!read) {
            try {
              await markAsRead({
                notificationId: notification.id as Id<'notifications'>,
              });
            } catch {
              // Silently fail - navigation is more important
            }
          }
        }}
        href={getNotificationLink()}
        className='hover:bg-accent/80 flex items-center text-card-foreground gap-3 p-2 pr-10 transition-all'
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

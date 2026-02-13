import { formatDate } from '@/lib/utils';
import { Doc } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useNotificationCloseStore } from '@/stores/notification-close-store';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import {
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useDeleteNotification,
} from '@/hooks/convex/use-notifications';

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
  const openFriendsDialog = useFriendsDialogStore(state => state.openDialog);

  // Optimistic notification mutations
  const markAsRead = useMarkNotificationAsRead();
  const markAsUnread = useMarkNotificationAsUnread();
  const deleteNotification = useDeleteNotification();

  const closeMenus = () => {
    setPopoverOpen(false);
    setNotificationSheetOpen(false);
  };

  // Get optional action for notifications that should trigger UI instead of navigation
  const getNotificationAction = (): (() => void) | null => {
    switch (type) {
      case 'FRIEND_REQUEST_RECEIVED':
        return () => openFriendsDialog('requests');
      case 'FRIEND_REQUEST_ACCEPTED':
        return () => openFriendsDialog('friends');
      default:
        return null;
    }
  };

  const getNotificationLink = (): string => {
    // EVENT_INVITE_RECEIVED navigates to the invites tab, not a specific event
    if (type === 'EVENT_INVITE_RECEIVED') return '/events?tab=invited';

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

      case 'EVENT_INVITE_ACCEPTED':
        return `/event/${eventId}`;

      case 'ADDON_CONFIG_RESET':
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

      case 'FRIEND_REQUEST_RECEIVED':
        return (
          <>
            <strong>{authorName}</strong> sent you a friend request
          </>
        );

      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <>
            <strong>{authorName}</strong> accepted your friend request
          </>
        );

      case 'EVENT_INVITE_RECEIVED':
        return (
          <>
            <strong>{authorName}</strong> invited you to{' '}
            <strong>{eventTitle}</strong>
          </>
        );

      case 'EVENT_INVITE_ACCEPTED':
        return (
          <>
            <strong>{authorName}</strong> accepted your invite to{' '}
            <strong>{eventTitle}</strong>
          </>
        );

      case 'ADDON_CONFIG_RESET':
        return (
          <>
            An add-on in <strong>{eventTitle}</strong> was updated — please
            resubmit your responses
          </>
        );

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
          onClick={() => {
            setSheetOpen(false);
            markAsUnread(notification._id);
          }}
        >
          <Icons.unread className='size-4 mr-2' />
          Mark as unread
        </Button>
      ) : (
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={() => {
            setSheetOpen(false);
            markAsRead(notification._id);
          }}
        >
          <Icons.read className='size-4 mr-2' />
          Mark as read
        </Button>
      )}
      <Button
        variant='ghost'
        className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
        onClick={() => {
          setSheetOpen(false);
          deleteNotification(notification._id);
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
          onClick={() => markAsUnread(notification._id)}
          className='cursor-pointer'
        >
          <div className='flex items-center gap-1'>
            <Icons.unread className='size-4' />
            <span>Mark as unread</span>
          </div>
        </ContextMenuItem>
      ) : (
        <ContextMenuItem
          onClick={() => markAsRead(notification._id)}
          className='cursor-pointer'
        >
          <div className='flex items-center gap-1'>
            <Icons.read className='size-4' />
            <span>Mark as read</span>
          </div>
        </ContextMenuItem>
      )}
      <ContextMenuItem
        onSelect={e => {
          e.preventDefault();
          deleteNotification(notification._id);
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
          onClick={() => markAsUnread(notification._id)}
          className='cursor-pointer'
        >
          <Icons.unread className='size-4' />
          <span>Mark as unread</span>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onClick={() => markAsRead(notification._id)}
          className='cursor-pointer'
        >
          <Icons.read className='size-4' />
          <span>Mark as read</span>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={() => deleteNotification(notification._id)}
        className='focus:bg-destructive focus:text-destructive-foreground cursor-pointer'
      >
        <Icons.delete className='size-4' />
        <span>Delete</span>
      </DropdownMenuItem>
    </>
  );

  const action = getNotificationAction();

  const handleNotificationClick = () => {
    closeMenus();
    // Mark as read when clicking
    if (!read) {
      markAsRead(notification._id);
    }
    // If there's an action, execute it
    if (action) {
      action();
    }
  };

  const notificationInner = (
    <>
      {!read && <div className='size-2 rounded-full bg-primary' />}
      <div className='flex flex-col gap-1 px-2'>
        <p className='text-sm'>{getNotificationMessage()}</p>
        <span className='text-xs text-muted-foreground'>
          {formatDate(createdAt)}
        </span>
      </div>
    </>
  );

  const notificationContent = (
    <div className='relative group'>
      {action ? (
        // Use a button/div for action-based notifications
        <button
          onClick={handleNotificationClick}
          className='hover:bg-accent/80 hover:shadow-raised flex items-center text-card-foreground gap-3 p-2 pr-10 transition-all duration-fast w-full text-left rounded-card'
        >
          {notificationInner}
        </button>
      ) : (
        // Use Link for navigation-based notifications
        <Link
          onClick={handleNotificationClick}
          href={getNotificationLink()}
          className='hover:bg-accent/80 hover:shadow-raised flex items-center text-card-foreground gap-3 p-2 pr-10 transition-all duration-fast rounded-card'
        >
          {notificationInner}
        </Link>
      )}

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

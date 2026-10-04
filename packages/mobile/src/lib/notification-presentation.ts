import type { Doc, Id } from 'convex/_generated/dataModel';

export interface NotificationPresentationInput
  extends Pick<
    Doc<'notifications'>,
    'type' | 'eventId' | 'postId' | 'rsvp' | 'groupId'
  > {
  group?: { id: Id<'groups'>; title: string } | null;
  groupInvite?: {
    id: Id<'groupInvites'>;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  } | null;
  event?: { id: Id<'events'>; title: string } | null;
  post?: { id: Id<'posts'>; title: string } | null;
  author?: {
    user: {
      name: string | null;
      email: string | null;
      username: string | null;
    };
  } | null;
}

function getAuthorName(notification: NotificationPresentationInput) {
  const author = notification.author?.user;
  return (
    author?.name ||
    author?.username ||
    author?.email?.split('@')[0] ||
    'Someone'
  );
}

export function getNotificationMessage(
  notification: NotificationPresentationInput
) {
  const authorName = getAuthorName(notification);
  const eventTitle = notification.event?.title ?? 'an event';
  const postTitle = notification.post?.title ?? 'a post';

  switch (notification.type) {
    case 'EVENT_APPLICATION_RECEIVED':
      return `A new application to ${eventTitle} is ready for review`;
    case 'EVENT_APPLICATION_APPROVED':
      return `Your application to ${eventTitle} was approved`;
    case 'EVENT_APPLICATION_DECLINED':
      return `Your application to ${eventTitle} was declined`;
    case 'EVENT_EDITED':
      return `${eventTitle} was updated`;
    case 'DATE_CHOSEN':
      return `A date was selected for ${eventTitle}`;
    case 'DATE_CHANGED':
      return `The date changed for ${eventTitle}`;
    case 'DATE_RESET':
      return `A new date poll started for ${eventTitle}`;
    case 'NEW_POST':
      return `${authorName} posted “${postTitle}” in ${eventTitle}`;
    case 'NEW_REPLY':
      return `${authorName} replied to “${postTitle}”`;
    case 'USER_MENTIONED':
      return `${authorName} mentioned you in “${postTitle}”`;
    case 'USER_JOINED':
      return `${authorName} joined ${eventTitle}`;
    case 'USER_LEFT':
      return `${authorName} left ${eventTitle}`;
    case 'USER_PROMOTED':
      return `You’re now a moderator of ${eventTitle}`;
    case 'USER_DEMOTED':
      return `Your moderator role was removed from ${eventTitle}`;
    case 'USER_RSVP':
      return `${authorName} RSVP’d ${notification.rsvp?.toLowerCase() ?? 'to'}${notification.rsvp ? ' to' : ''} ${eventTitle}`;
    case 'EVENT_REMINDER':
      return `${eventTitle} is starting soon`;
    case 'FRIEND_REQUEST_RECEIVED':
      return `${authorName} sent you a friend request`;
    case 'FRIEND_REQUEST_ACCEPTED':
      return `${authorName} accepted your friend request`;
    case 'GROUP_INVITE_RECEIVED': {
      const title = notification.group?.title ?? 'a Group';
      const status = notification.groupInvite?.status;
      return status && status !== 'PENDING'
        ? `Group invitation to ${title}: ${status.toLowerCase()}`
        : `${authorName} invited you to ${title}`;
    }
    case 'GROUP_MEMBER_REMOVED':
      return 'You were removed from the Group.';
    case 'GROUP_MEMBER_BANNED':
      return 'You were banned from the Group.';
    case 'GROUP_INVITE_ACCEPTED':
      return `${authorName} accepted your invitation to ${notification.group?.title ?? 'a Group'}`;
    case 'EVENT_INVITE_RECEIVED':
      return `${authorName} invited you to ${eventTitle}`;
    case 'EVENT_INVITE_ACCEPTED':
      return `${authorName} accepted your invite to ${eventTitle}`;
    case 'ADDON_CONFIG_RESET':
      return `An add-on in ${eventTitle} changed. Please review your responses.`;
    case 'ADDON_AUTOMATION':
      return `An add-on in ${eventTitle} has an update for you`;
  }
}

export function getNotificationDestination(
  notification: NotificationPresentationInput
): string | null {
  if (
    notification.type === 'GROUP_INVITE_RECEIVED' ||
    notification.type === 'GROUP_INVITE_ACCEPTED' ||
    notification.type === 'GROUP_MEMBER_REMOVED' ||
    notification.type === 'GROUP_MEMBER_BANNED'
  ) {
    const groupId = notification.group?.id ?? notification.groupId;
    return groupId ? `/g/${groupId}` : null;
  }
  if (notification.type === 'EVENT_INVITE_RECEIVED') return '/invites';
  if (
    notification.type === 'FRIEND_REQUEST_RECEIVED' ||
    notification.type === 'FRIEND_REQUEST_ACCEPTED'
  ) {
    return '/friends';
  }
  if (!notification.eventId) return null;
  if (notification.type === 'EVENT_APPLICATION_RECEIVED')
    return `/event/${notification.eventId}/applications`;
  if (
    notification.type === 'EVENT_APPLICATION_APPROVED' ||
    notification.type === 'EVENT_APPLICATION_DECLINED'
  )
    return `/event/${notification.eventId}/application`;
  if (notification.postId) {
    return `/event/${notification.eventId}/post/${notification.postId}`;
  }
  return `/event/${notification.eventId}`;
}

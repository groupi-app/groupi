// Define the notification type locally since it's not exported from schema
type NotificationWithPersonEventPost = {
  type: string;
  event?: { title?: string } | null;
  post?: { title?: string } | null;
  author?: { user: { name?: string | null; email?: string } } | null;
  rsvp?: string | null;
};

export function getNotificationSubject(
  notification: NotificationWithPersonEventPost
): string {
  const { type, event, post, author, rsvp } = notification;

  // Helper to get author name
  const getAuthorName = () => {
    if (!author?.user) return 'Someone';
    return author.user.name || author.user.email?.split('@')[0] || 'Someone';
  };

  switch (type) {
    case 'EVENT_EDITED':
      return `Event Updated: ${event?.title || 'Event'}`;

    case 'DATE_CHOSEN':
      return `Date Set for ${event?.title || 'Event'}`;

    case 'DATE_CHANGED':
      return `Date Changed for ${event?.title || 'Event'}`;

    case 'DATE_RESET':
      return `New Date Poll for ${event?.title || 'Event'}`;

    case 'NEW_POST':
      return `New Post in ${event?.title || 'Event'}: ${post?.title || 'Post'}`;

    case 'NEW_REPLY':
      return `New Reply to ${post?.title || 'Post'}`;

    case 'USER_MENTIONED':
      return `${getAuthorName()} mentioned you in ${post?.title || 'Post'}`;

    case 'USER_JOINED':
      return `${getAuthorName()} Joined ${event?.title || 'Event'}`;

    case 'USER_LEFT':
      return `${getAuthorName()} Left ${event?.title || 'Event'}`;

    case 'USER_PROMOTED':
      return `You're Now a Moderator of ${event?.title || 'Event'}`;

    case 'USER_DEMOTED':
      return `Moderator Status Removed for ${event?.title || 'Event'}`;

    case 'USER_RSVP': {
      const rsvpStatus = rsvp ? rsvp.toLowerCase() : 'responded';
      return `${getAuthorName()} RSVP'd ${rsvpStatus} to ${event?.title || 'Event'}`;
    }

    default:
      return `Notification from ${event?.title || 'Groupi'}`;
  }
}

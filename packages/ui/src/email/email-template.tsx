import { NotificationFeedDTO } from '@groupi/schema';

interface EmailTemplateProps {
  notification: NotificationFeedDTO;
}

export function NotificationEmailTemplate({
  notification,
}: Readonly<EmailTemplateProps>) {
  const { event, post, type, datetime, author, rsvp } = notification;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Use hosted logo URL for email compatibility
  const logoUrl = `${baseUrl}/groupi.svg`;

  // Helper to get a dynamic heading based on notification type
  const getEmailHeading = () => {
    switch (type) {
      case 'EVENT_EDITED':
      case 'DATE_CHANGED':
      case 'DATE_CHOSEN':
      case 'DATE_RESET':
        return 'Event Updated!';
      case 'NEW_POST':
        return 'New Post!';
      case 'NEW_REPLY':
        return 'New Reply!';
      case 'USER_JOINED':
      case 'USER_LEFT':
      case 'USER_PROMOTED':
      case 'USER_DEMOTED':
        return 'Membership Updated!';
      case 'USER_RSVP':
        return 'New RSVP!';
      default:
        return 'Groupi';
    }
  };

  // Helper to get the link for the notification
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
        return `${baseUrl}/event/${event?.id}`;
      case 'NEW_POST':
      case 'NEW_REPLY':
        return `${baseUrl}/post/${post?.id}`;
      default:
        return `${baseUrl}/event/${event?.id}`;
    }
  };

  // Helper to get the message for the notification
  const getNotificationMessage = () => {
    switch (type) {
      case 'EVENT_EDITED':
        return (
          <div>
            The details of <strong>{event?.title}</strong> have been updated.
          </div>
        );
      case 'DATE_CHANGED':
        return (
          <div>
            The date of <strong>{event?.title}</strong> has changed to{' '}
            <strong>
              {datetime
                ? new Date(datetime).toLocaleString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })
                : ''}
            </strong>
            .
          </div>
        );
      case 'DATE_CHOSEN':
        return (
          <div>
            <strong>{event?.title}</strong> will be held on{' '}
            <strong>
              {datetime
                ? new Date(datetime).toLocaleString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })
                : ''}
            </strong>
            .
          </div>
        );
      case 'DATE_RESET':
        return (
          <div>
            A new poll has started for the date of{' '}
            <strong>{event?.title}</strong>.
          </div>
        );
      case 'NEW_POST':
        return (
          <div>
            <strong>
              {author?.user.name ?? author?.user.email.split('@')[0]}
            </strong>{' '}
            created a new post, <strong>{post?.title}</strong>, in{' '}
            <strong>{event?.title}</strong>.
          </div>
        );
      case 'NEW_REPLY':
        return (
          <div>
            <strong>
              {author?.user.name ?? author?.user.email.split('@')[0]}
            </strong>{' '}
            replied to a post, <strong>{post?.title}</strong>, in{' '}
            <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_JOINED':
        return (
          <div>
            <strong>
              {author?.user.name ?? author?.user.email.split('@')[0]}
            </strong>{' '}
            has joined <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_LEFT':
        return (
          <div>
            <strong>
              {author?.user.name ?? author?.user.email.split('@')[0]}
            </strong>{' '}
            has left <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_PROMOTED':
        return (
          <div>
            You are now a Moderator of <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_DEMOTED':
        return (
          <div>
            You are no longer a Moderator of <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_RSVP':
        return (
          <div>
            <strong>
              {author?.user.name ?? author?.user.email.split('@')[0]}
            </strong>{' '}
            has RSVP&apos;d <strong>{rsvp}</strong> to{' '}
            <strong>{event?.title}</strong>.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        color: '#222',
        background: '#fff',
        padding: 24,
        borderRadius: 8,
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt='Groupi Logo'
        style={{ maxWidth: '200px', height: 'auto' }}
      />
      <h2
        style={{
          color: '#1a202c',
          fontSize: '24px',
          marginBottom: 16,
        }}
      >
        {getEmailHeading()}
      </h2>
      <p>{getNotificationMessage()}</p>
      <a
        href={getNotificationLink()}
        style={{
          display: 'block',
          marginTop: 24,
          padding: '12px 24px',
          background: '#007bff',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        View Notification
      </a>
    </div>
  );
}

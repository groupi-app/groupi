import type { WebhookNotificationDTO } from '@groupi/schema';

interface EmailTemplateProps {
  notification: WebhookNotificationDTO;
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
              {author?.firstName ?? author?.lastName ?? author?.username}
            </strong>{' '}
            created a new post, <strong>{post?.title}</strong>, in{' '}
            <strong>{event?.title}</strong>.
          </div>
        );
      case 'NEW_REPLY':
        return (
          <div>
            <strong>
              {author?.firstName ?? author?.lastName ?? author?.username}
            </strong>{' '}
            replied to a post, <strong>{post?.title}</strong>, in{' '}
            <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_JOINED':
        return (
          <div>
            <strong>
              {author?.firstName ?? author?.lastName ?? author?.username}
            </strong>{' '}
            has joined <strong>{event?.title}</strong>.
          </div>
        );
      case 'USER_LEFT':
        return (
          <div>
            <strong>
              {author?.firstName ?? author?.lastName ?? author?.username}
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
              {author?.firstName ?? author?.lastName ?? author?.username}
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
          fontSize: 22,
          marginBottom: 12,
        }}
      >
        {getEmailHeading()}
      </h2>
      <div
        style={{
          fontSize: 16,
          marginBottom: 20,
        }}
      >
        {getNotificationMessage()}
      </div>
      <a
        href={getNotificationLink()}
        style={{
          display: 'inline-block',
          background: '#8200ad',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        View {type === 'NEW_POST' || type === 'NEW_REPLY' ? 'Post' : 'Event'}
      </a>
    </div>
  );
}

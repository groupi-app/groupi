// Webhook template system for different notification services
import type {
  WebhookNotificationData,
  NotificationTypeType,
} from '@groupi/schema';
import { WebhookFormat } from '@prisma/client';

export type WebhookVariables = {
  message: string;
  heading: string;
  eventTitle?: string;
  postTitle?: string;
  authorName?: string;
  notificationType: NotificationTypeType;
  timestamp: string;
  eventUrl?: string;
  postUrl?: string;
  appName: string;
};

export type WebhookTemplate = {
  name: string;
  description: string;
  defaultHeaders: Record<string, string>;
  template: string; // JSON template with {{variable}} placeholders
};

// Predefined webhook templates for popular services
export const WEBHOOK_TEMPLATES: Record<string, WebhookTemplate> = {
  GENERIC: {
    name: 'Generic JSON',
    description: 'Simple JSON format for custom integrations',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    template: JSON.stringify(
      {
        notification: {
          type: '{{notificationType}}',
          heading: '{{heading}}',
          message: '{{message}}',
          timestamp: '{{timestamp}}',
          event: {
            title: '{{eventTitle}}',
            url: '{{eventUrl}}',
          },
          post: {
            title: '{{postTitle}}',
            url: '{{postUrl}}',
          },
          author: {
            name: '{{authorName}}',
          },
          source: '{{appName}}',
        },
      },
      null,
      2
    ),
  },
  DISCORD: {
    name: 'Discord',
    description: 'Send notifications to Discord channels via webhooks',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    template: JSON.stringify(
      {
        embeds: [
          {
            title: '{{heading}}',
            description: '{{message}}',
            color: 11349736, // Purple color matching app theme
            timestamp: '{{timestamp}}',
            url: '{{eventUrl}}', // Makes the embed title clickable
            fields: [
              {
                name: 'Actions',
                value: '[View Event]({{eventUrl}})',
                inline: false,
              },
            ],
            footer: {
              text: '{{appName}}',
            },
          },
        ],
      },
      null,
      2
    ),
  },

  SLACK: {
    name: 'Slack',
    description: 'Send notifications to Slack channels via webhooks',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    template: JSON.stringify(
      {
        text: '{{heading}}',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*{{heading}}*\n{{message}}',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Event',
                },
                url: '{{eventUrl}}',
                style: 'primary',
              },
            ],
          },
        ],
      },
      null,
      2
    ),
  },

  TEAMS: {
    name: 'Microsoft Teams',
    description: 'Send notifications to Microsoft Teams channels',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    template: JSON.stringify(
      {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '8200AD', // App primary color
        sections: [
          {
            activityTitle: '{{heading}}',
            activitySubtitle: '{{message}}',
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'View Event',
            targets: [
              {
                os: 'default',
                uri: '{{eventUrl}}',
              },
            ],
          },
        ],
      },
      null,
      2
    ),
  },
  CUSTOM: {
    name: 'Custom Template',
    description: 'Define your own JSON template with variables',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    template:
      '{\n  "message": "{{message}}",\n  "timestamp": "{{timestamp}}"\n}',
  },
};

/**
 * Extract variables from a notification for webhook templating
 */
export function extractWebhookVariables(
  notification: WebhookNotificationData
): WebhookVariables {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Get notification message (reuse logic from email template)
  const getNotificationMessage = () => {
    const { event, post, type, datetime, author, rsvp } = notification;

    switch (type) {
      case 'EVENT_EDITED':
        return `The details of ${event?.title} have been updated.`;
      case 'DATE_CHANGED':
        return `The date of ${event?.title} has changed to ${datetime ? new Date(datetime).toLocaleString() : ''}.`;
      case 'DATE_CHOSEN':
        return `${event?.title} will be held on ${datetime ? new Date(datetime).toLocaleString() : ''}.`;
      case 'DATE_RESET':
        return `A new poll has started for the date of ${event?.title}.`;
      case 'NEW_POST':
        return `${author?.user.name ?? author?.user.email.split('@')[0]} created a new post, ${post?.title}, in ${event?.title}.`;
      case 'NEW_REPLY':
        return `${author?.user.name ?? author?.user.email.split('@')[0]} replied to a post, ${post?.title}, in ${event?.title}.`;
      case 'USER_MENTIONED':
        return `${author?.user.name ?? author?.user.email.split('@')[0]} mentioned you in ${post?.title}.`;
      case 'USER_JOINED':
        return `${author?.user.name ?? author?.user.email.split('@')[0]} has joined ${event?.title}.`;
      case 'USER_LEFT':
        return `${author?.user.name ?? author?.user.email.split('@')[0]} has left ${event?.title}.`;
      case 'USER_PROMOTED':
        return `You are now a Moderator of ${event?.title}.`;
      case 'USER_DEMOTED':
        return `You are no longer a Moderator of ${event?.title}.`;
      case 'USER_RSVP':
        return `${author?.user.name ?? author?.user.email.split('@')[0]} has RSVP'd ${rsvp} to ${event?.title}.`;
      default:
        return 'Notification from Groupi';
    }
  };

  // Get notification heading (reuse logic from email template)
  const getEmailHeading = () => {
    switch (notification.type) {
      case 'EVENT_EDITED':
      case 'DATE_CHANGED':
      case 'DATE_CHOSEN':
      case 'DATE_RESET':
        return 'Event Updated!';
      case 'NEW_POST':
        return 'New Post!';
      case 'NEW_REPLY':
        return 'New Reply!';
      case 'USER_MENTIONED':
        return 'You Were Mentioned!';
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

  const authorName =
    notification.author?.user.name ??
    notification.author?.user.email.split('@')[0] ??
    'Unknown User';

  return {
    message: getNotificationMessage(),
    heading: getEmailHeading(),
    eventTitle: notification.event?.title ?? '',
    postTitle: notification.post?.title ?? '',
    authorName,
    notificationType: notification.type,
    timestamp: notification.createdAt.toISOString(),
    eventUrl: notification.event
      ? `${baseUrl}/event/${notification.event.id}`
      : '',
    postUrl: notification.post ? `${baseUrl}/post/${notification.post.id}` : '',
    appName: 'Groupi',
  };
}

/**
 * Replace template variables with actual values
 */
export function replaceTemplateVariables(
  template: string,
  variables: WebhookVariables
): string {
  let result = template;

  // Replace all {{variable}} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });

  return result;
}

/**
 * Generate webhook payload from template and notification
 */
export function generateWebhookPayload(
  notification: WebhookNotificationData,
  webhookFormat: WebhookFormat,
  customTemplate?: string // Custom JSON template from database (customTemplate field)
): { payload: string; headers: Record<string, string> } {
  const variables = extractWebhookVariables(notification);

  let template: WebhookTemplate;

  if (webhookFormat === WebhookFormat.CUSTOM && customTemplate) {
    template = {
      ...WEBHOOK_TEMPLATES.CUSTOM,
      template: customTemplate,
    };
  } else {
    template = WEBHOOK_TEMPLATES[webhookFormat] || WEBHOOK_TEMPLATES.GENERIC;
  }

  const payload = replaceTemplateVariables(template.template, variables);

  return {
    payload,
    headers: template.defaultHeaders,
  };
}

/**
 * Get available webhook formats for UI selection
 */
export function getAvailableWebhookFormats() {
  return Object.entries(WEBHOOK_TEMPLATES).map(([key, template]) => ({
    value: key,
    label: template.name,
    description: template.description,
  }));
}

import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { presence } from '../presence';
import { authComponent, AuthUserId } from '../auth';
import { Resend } from 'resend';

// Initialize Resend client for email sending
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Check if a person has muted an event
 */
export async function isEventMutedByPerson(
  ctx: MutationCtx | QueryCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
): Promise<boolean> {
  const mute = await ctx.db
    .query('mutedEvents')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  return !!mute;
}

/**
 * Check if a person has muted a post
 */
export async function isPostMutedByPerson(
  ctx: MutationCtx | QueryCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
): Promise<boolean> {
  const mute = await ctx.db
    .query('mutedPosts')
    .withIndex('by_person_post', q =>
      q.eq('personId', personId).eq('postId', postId)
    )
    .first();
  return !!mute;
}

/**
 * Check if a notification should be skipped due to muting
 * Checks both event-level and post-level muting
 */
export async function shouldSkipNotificationDueToMute(
  ctx: MutationCtx | QueryCtx,
  personId: Id<'persons'>,
  eventId?: Id<'events'>,
  postId?: Id<'posts'>
): Promise<boolean> {
  // Check post mute first (more specific)
  if (postId) {
    const postMuted = await isPostMutedByPerson(ctx, personId, postId);
    if (postMuted) return true;
  }

  // Check event mute
  if (eventId) {
    const eventMuted = await isEventMutedByPerson(ctx, personId, eventId);
    if (eventMuted) return true;
  }

  return false;
}

/**
 * Notification types matching the schema
 */
export type NotificationType =
  | 'EVENT_EDITED'
  | 'NEW_POST'
  | 'NEW_REPLY'
  | 'DATE_CHOSEN'
  | 'DATE_CHANGED'
  | 'DATE_RESET'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'USER_PROMOTED'
  | 'USER_DEMOTED'
  | 'USER_RSVP'
  | 'USER_MENTIONED'
  | 'EVENT_REMINDER';

export type RsvpStatus = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

/**
 * Extract person IDs from mentions in HTML content
 * Mentions are formatted as: <span class="mention" data-id="personId">@label</span>
 */
export function extractMentionedPersonIds(content: string): string[] {
  // Match data-id attributes in mention spans
  const mentionRegex = /data-id=["']([^"']+)["']/g;
  const personIds: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const personId = match[1];
    if (personId && !personIds.includes(personId)) {
      personIds.push(personId);
    }
  }

  return personIds;
}

/**
 * Notify mentioned users in a post or reply
 * Skips the author and users who have muted the event/post
 */
export async function notifyMentionedUsers(
  ctx: MutationCtx,
  data: {
    content: string;
    authorId: Id<'persons'>;
    eventId: Id<'events'>;
    postId: Id<'posts'>;
  }
): Promise<{ sent: number; skipped: number }> {
  const mentionedPersonIds = extractMentionedPersonIds(data.content);

  let sent = 0;
  let skipped = 0;

  for (const personIdStr of mentionedPersonIds) {
    const personId = personIdStr as Id<'persons'>;

    // Skip if the author mentioned themselves
    if (personId === data.authorId) {
      continue;
    }

    // Check if this person exists and is a member of the event
    const person = await ctx.db.get(personId);
    if (!person) {
      skipped++;
      continue;
    }

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', data.eventId)
      )
      .first();

    if (!membership) {
      skipped++;
      continue;
    }

    // Check if user has muted this event or post
    const shouldSkip = await shouldSkipNotificationDueToMute(
      ctx,
      personId,
      data.eventId,
      data.postId
    );

    if (shouldSkip) {
      skipped++;
      continue;
    }

    // Create the mention notification
    await createNotification(ctx, {
      personId,
      type: 'USER_MENTIONED',
      authorId: data.authorId,
      eventId: data.eventId,
      postId: data.postId,
    });
    sent++;
  }

  return { sent, skipped };
}

/**
 * Get enabled email addresses for a person and notification type
 * Returns an array of email addresses that should receive this notification
 */
async function getEnabledEmailsForNotification(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  notificationType: NotificationType
): Promise<string[]> {
  // Get person's settings
  const settings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', personId))
    .first();

  if (!settings) {
    return [];
  }

  // Get all notification methods for this person
  const methods = await ctx.db
    .query('notificationMethods')
    .withIndex('by_settings', q => q.eq('settingsId', settings._id))
    .collect();

  // Filter to enabled EMAIL methods
  const emailMethods = methods.filter(m => m.type === 'EMAIL' && m.enabled);

  if (emailMethods.length === 0) {
    return [];
  }

  // Check if notification type is enabled for each email method
  const enabledEmails: string[] = [];

  for (const method of emailMethods) {
    // Check if there's a specific setting for this notification type
    const typeSetting = await ctx.db
      .query('notificationSettings')
      .withIndex('by_type_method', q =>
        q.eq('notificationType', notificationType).eq('methodId', method._id)
      )
      .first();

    // If there's a setting, use it; otherwise default to enabled
    const isEnabled = typeSetting ? typeSetting.enabled : true;

    if (isEnabled) {
      enabledEmails.push(method.value);
    }
  }

  return enabledEmails;
}

/**
 * Generate email subject for a notification type
 */
function getNotificationEmailSubject(
  type: NotificationType,
  eventTitle?: string
): string {
  const prefix = eventTitle ? `[${eventTitle}] ` : '';

  switch (type) {
    case 'NEW_POST':
      return `${prefix}New post`;
    case 'NEW_REPLY':
      return `${prefix}New reply`;
    case 'EVENT_EDITED':
      return `${prefix}Event updated`;
    case 'DATE_CHOSEN':
      return `${prefix}Event date chosen`;
    case 'DATE_CHANGED':
      return `${prefix}Event date changed`;
    case 'DATE_RESET':
      return `${prefix}Event date reset`;
    case 'USER_JOINED':
      return `${prefix}New attendee`;
    case 'USER_LEFT':
      return `${prefix}Attendee left`;
    case 'USER_PROMOTED':
      return `${prefix}You were promoted`;
    case 'USER_DEMOTED':
      return `${prefix}Role changed`;
    case 'USER_RSVP':
      return `${prefix}RSVP update`;
    case 'USER_MENTIONED':
      return `${prefix}You were mentioned`;
    case 'EVENT_REMINDER':
      return `${prefix}Event reminder`;
    default:
      return `${prefix}Notification`;
  }
}

/**
 * Generate email HTML body for a notification
 */
function getNotificationEmailHtml(
  type: NotificationType,
  eventTitle?: string,
  authorName?: string
): string {
  const siteUrl = process.env.SITE_URL || 'https://groupi.gg';

  let message = '';
  switch (type) {
    case 'NEW_POST':
      message = authorName
        ? `${authorName} created a new post`
        : 'A new post was created';
      break;
    case 'NEW_REPLY':
      message = authorName
        ? `${authorName} replied to a thread`
        : 'There is a new reply in a thread';
      break;
    case 'EVENT_EDITED':
      message = 'The event details have been updated';
      break;
    case 'DATE_CHOSEN':
      message = 'A date has been chosen for the event';
      break;
    case 'DATE_CHANGED':
      message = 'The event date has been changed';
      break;
    case 'DATE_RESET':
      message = 'The event date has been reset';
      break;
    case 'USER_JOINED':
      message = authorName
        ? `${authorName} joined the event`
        : 'A new attendee joined';
      break;
    case 'USER_LEFT':
      message = authorName
        ? `${authorName} left the event`
        : 'An attendee left the event';
      break;
    case 'USER_PROMOTED':
      message = 'You have been promoted';
      break;
    case 'USER_DEMOTED':
      message = 'Your role has been changed';
      break;
    case 'USER_RSVP':
      message = authorName
        ? `${authorName} updated their RSVP`
        : 'An RSVP was updated';
      break;
    case 'USER_MENTIONED':
      message = authorName
        ? `${authorName} mentioned you`
        : 'You were mentioned';
      break;
    case 'EVENT_REMINDER':
      message = 'Your event is coming up soon!';
      break;
    default:
      message = 'You have a new notification';
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">${eventTitle || 'Groupi'}</h1>
        <p style="font-size: 16px;">${message}</p>
        <div style="margin: 30px 0;">
          <a href="${siteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View on Groupi
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          You received this email because you have email notifications enabled on Groupi.
          <br/>
          <a href="${siteUrl}/settings/notifications" style="color: #666;">Manage notification preferences</a>
        </p>
      </body>
    </html>
  `;
}

/**
 * Send email notifications for a notification if the user has email enabled
 */
async function sendEmailNotifications(
  ctx: MutationCtx,
  data: {
    personId: Id<'persons'>;
    type: NotificationType;
    authorId?: Id<'persons'>;
    eventId?: Id<'events'>;
  }
): Promise<void> {
  // Get enabled emails for this notification type
  const emails = await getEnabledEmailsForNotification(
    ctx,
    data.personId,
    data.type
  );

  if (emails.length === 0) {
    return;
  }

  // Get event title if we have an event
  let eventTitle: string | undefined;
  if (data.eventId) {
    const event = await ctx.db.get(data.eventId);
    eventTitle = event?.title;
  }

  // Get author name if we have an author
  let authorName: string | undefined;
  if (data.authorId) {
    const authorPerson = await ctx.db.get(data.authorId);
    if (authorPerson) {
      const authorUser = await authComponent.getAnyUserById(
        ctx,
        authorPerson.userId as AuthUserId
      );
      authorName = authorUser?.name || authorUser?.email || undefined;
    }
  }

  // Generate email content
  const subject = getNotificationEmailSubject(data.type, eventTitle);
  const html = getNotificationEmailHtml(data.type, eventTitle, authorName);

  // Send email for each email address
  if (!resendClient) {
    return;
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'Groupi <notifications@groupi.gg>';

  for (const email of emails) {
    try {
      const result = await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html,
      });

      if (result.error) {
        console.error(
          `Resend API error for ${email}:`,
          result.error.message,
          result.error
        );
      } else {
        console.log(
          `Notification email sent to ${email}, id: ${result.data?.id}`
        );
      }
    } catch (error) {
      console.error(`Failed to send notification email to ${email}:`, error);
    }
  }
}

type WebhookFormat = 'DISCORD' | 'SLACK' | 'TEAMS' | 'GENERIC' | 'CUSTOM';

interface WebhookMethod {
  url: string;
  format: WebhookFormat;
  headers?: Record<string, string>;
  customTemplate?: string;
}

/**
 * Get enabled webhook methods for a person and notification type
 */
async function getEnabledWebhooksForNotification(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  notificationType: NotificationType
): Promise<WebhookMethod[]> {
  const settings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', personId))
    .first();

  if (!settings) {
    return [];
  }

  const methods = await ctx.db
    .query('notificationMethods')
    .withIndex('by_settings', q => q.eq('settingsId', settings._id))
    .collect();

  const webhookMethods = methods.filter(m => m.type === 'WEBHOOK' && m.enabled);

  if (webhookMethods.length === 0) {
    return [];
  }

  const enabledWebhooks: WebhookMethod[] = [];

  for (const method of webhookMethods) {
    const typeSetting = await ctx.db
      .query('notificationSettings')
      .withIndex('by_type_method', q =>
        q.eq('notificationType', notificationType).eq('methodId', method._id)
      )
      .first();

    const isEnabled = typeSetting ? typeSetting.enabled : true;

    if (isEnabled) {
      enabledWebhooks.push({
        url: method.value,
        format: (method.webhookFormat as WebhookFormat) || 'GENERIC',
        headers: method.webhookHeaders as Record<string, string> | undefined,
        customTemplate: method.customTemplate,
      });
    }
  }

  return enabledWebhooks;
}

/**
 * Format webhook payload based on webhook format
 */
function formatWebhookPayload(
  format: WebhookFormat,
  data: {
    type: NotificationType;
    eventTitle?: string;
    authorName?: string;
    message: string;
  },
  customTemplate?: string
): object {
  const siteUrl = process.env.SITE_URL || 'https://groupi.gg';

  switch (format) {
    case 'DISCORD':
      return {
        embeds: [
          {
            title: data.eventTitle || 'Groupi Notification',
            description: data.message,
            color: 0x2563eb, // Blue color
            footer: {
              text: 'Groupi',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

    case 'SLACK':
      return {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${data.eventTitle || 'Groupi'}*\n${data.message}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View on Groupi',
                },
                url: siteUrl,
              },
            ],
          },
        ],
      };

    case 'TEAMS':
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '2563eb',
        summary: data.message,
        sections: [
          {
            activityTitle: data.eventTitle || 'Groupi Notification',
            text: data.message,
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'View on Groupi',
            targets: [{ os: 'default', uri: siteUrl }],
          },
        ],
      };

    case 'CUSTOM':
      if (customTemplate) {
        try {
          // Simple template replacement
          let payload = customTemplate;
          payload = payload.replace(/\{\{type\}\}/g, data.type);
          payload = payload.replace(/\{\{message\}\}/g, data.message);
          payload = payload.replace(
            /\{\{eventTitle\}\}/g,
            data.eventTitle || ''
          );
          payload = payload.replace(
            /\{\{authorName\}\}/g,
            data.authorName || ''
          );
          payload = payload.replace(
            /\{\{timestamp\}\}/g,
            new Date().toISOString()
          );
          return JSON.parse(payload);
        } catch {
          console.error('Failed to parse custom webhook template');
        }
      }
    // Fall through to GENERIC if custom template fails

    case 'GENERIC':
    default:
      return {
        type: data.type,
        message: data.message,
        eventTitle: data.eventTitle,
        authorName: data.authorName,
        timestamp: new Date().toISOString(),
        source: 'groupi',
      };
  }
}

/**
 * Get a human-readable message for the notification type
 */
function getNotificationMessage(
  type: NotificationType,
  authorName?: string
): string {
  switch (type) {
    case 'NEW_POST':
      return authorName
        ? `${authorName} created a new post`
        : 'A new post was created';
    case 'NEW_REPLY':
      return authorName
        ? `${authorName} replied to a thread`
        : 'There is a new reply in a thread';
    case 'EVENT_EDITED':
      return 'The event details have been updated';
    case 'DATE_CHOSEN':
      return 'A date has been chosen for the event';
    case 'DATE_CHANGED':
      return 'The event date has been changed';
    case 'DATE_RESET':
      return 'The event date has been reset';
    case 'USER_JOINED':
      return authorName
        ? `${authorName} joined the event`
        : 'A new attendee joined';
    case 'USER_LEFT':
      return authorName
        ? `${authorName} left the event`
        : 'An attendee left the event';
    case 'USER_PROMOTED':
      return 'You have been promoted';
    case 'USER_DEMOTED':
      return 'Your role has been changed';
    case 'USER_RSVP':
      return authorName
        ? `${authorName} updated their RSVP`
        : 'An RSVP was updated';
    case 'USER_MENTIONED':
      return authorName ? `${authorName} mentioned you` : 'You were mentioned';
    case 'EVENT_REMINDER':
      return 'Your event is coming up soon!';
    default:
      return 'You have a new notification';
  }
}

/**
 * Send webhook notifications for a notification
 */
async function sendWebhookNotifications(
  ctx: MutationCtx,
  data: {
    personId: Id<'persons'>;
    type: NotificationType;
    authorId?: Id<'persons'>;
    eventId?: Id<'events'>;
  }
): Promise<void> {
  const webhooks = await getEnabledWebhooksForNotification(
    ctx,
    data.personId,
    data.type
  );

  if (webhooks.length === 0) {
    return;
  }

  // Get event title if we have an event
  let eventTitle: string | undefined;
  if (data.eventId) {
    const event = await ctx.db.get(data.eventId);
    eventTitle = event?.title;
  }

  // Get author name if we have an author
  let authorName: string | undefined;
  if (data.authorId) {
    const authorPerson = await ctx.db.get(data.authorId);
    if (authorPerson) {
      const authorUser = await authComponent.getAnyUserById(
        ctx,
        authorPerson.userId as AuthUserId
      );
      authorName = authorUser?.name || authorUser?.email || undefined;
    }
  }

  const message = getNotificationMessage(data.type, authorName);

  for (const webhook of webhooks) {
    try {
      const payload = formatWebhookPayload(
        webhook.format,
        { type: data.type, eventTitle, authorName, message },
        webhook.customTemplate
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...webhook.headers,
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Webhook notification sent to ${webhook.url}`);
      } else {
        console.error(
          `Webhook notification failed for ${webhook.url}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to send webhook notification to ${webhook.url}:`,
        error
      );
    }
  }
}

/**
 * Create a notification for a single recipient
 * Also sends email notification if the user has email enabled for this notification type
 */
export async function createNotification(
  ctx: MutationCtx,
  data: {
    personId: Id<'persons'>;
    type: NotificationType;
    authorId?: Id<'persons'>;
    eventId?: Id<'events'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
  }
) {
  // Insert the notification into the database
  const notificationId = await ctx.db.insert('notifications', {
    personId: data.personId,
    type: data.type,
    authorId: data.authorId,
    eventId: data.eventId,
    postId: data.postId,
    datetime: data.datetime,
    rsvp: data.rsvp,
    read: false,
    updatedAt: Date.now(),
  });

  // Send email notifications
  await sendEmailNotifications(ctx, {
    personId: data.personId,
    type: data.type,
    authorId: data.authorId,
    eventId: data.eventId,
  });

  // Send webhook notifications
  await sendWebhookNotifications(ctx, {
    personId: data.personId,
    type: data.type,
    authorId: data.authorId,
    eventId: data.eventId,
  });

  return notificationId;
}

/**
 * Create notifications for all members of an event (except the author)
 * Respects mute settings - skips users who have muted the event or post
 */
export async function notifyEventMembers(
  ctx: MutationCtx,
  data: {
    eventId: Id<'events'>;
    type: NotificationType;
    authorId: Id<'persons'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
    excludePersonIds?: Id<'persons'>[];
  }
): Promise<{ sent: Id<'notifications'>[]; skippedMuted: number }> {
  // Get all memberships for this event
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', data.eventId))
    .collect();

  const excludeIds = new Set([data.authorId, ...(data.excludePersonIds || [])]);

  // Create notification for each member (except author, excluded, and muted)
  const notificationIds: Id<'notifications'>[] = [];
  let skippedMuted = 0;

  for (const membership of memberships) {
    if (!excludeIds.has(membership.personId)) {
      // Check if user has muted this event or post
      const shouldSkip = await shouldSkipNotificationDueToMute(
        ctx,
        membership.personId,
        data.eventId,
        data.postId
      );

      if (shouldSkip) {
        skippedMuted++;
        continue;
      }

      const id = await createNotification(ctx, {
        personId: membership.personId,
        type: data.type,
        authorId: data.authorId,
        eventId: data.eventId,
        postId: data.postId,
        datetime: data.datetime,
        rsvp: data.rsvp,
      });
      notificationIds.push(id);
    }
  }

  return { sent: notificationIds, skippedMuted };
}

/**
 * Create notifications for organizers and moderators of an event
 * Respects mute settings - skips users who have muted the event
 */
export async function notifyEventModerators(
  ctx: MutationCtx,
  data: {
    eventId: Id<'events'>;
    type: NotificationType;
    authorId: Id<'persons'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
  }
): Promise<{ sent: Id<'notifications'>[]; skippedMuted: number }> {
  // Get all memberships for this event
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', data.eventId))
    .collect();

  // Filter to moderators and organizers (excluding author)
  const moderators = memberships.filter(
    m =>
      (m.role === 'ORGANIZER' || m.role === 'MODERATOR') &&
      m.personId !== data.authorId
  );

  // Create notification for each moderator (respecting mute settings)
  const notificationIds: Id<'notifications'>[] = [];
  let skippedMuted = 0;

  for (const membership of moderators) {
    // Check if user has muted this event
    const shouldSkip = await shouldSkipNotificationDueToMute(
      ctx,
      membership.personId,
      data.eventId,
      data.postId
    );

    if (shouldSkip) {
      skippedMuted++;
      continue;
    }

    const id = await createNotification(ctx, {
      personId: membership.personId,
      type: data.type,
      authorId: data.authorId,
      eventId: data.eventId,
      postId: data.postId,
      datetime: data.datetime,
      rsvp: data.rsvp,
    });
    notificationIds.push(id);
  }

  return { sent: notificationIds, skippedMuted };
}

/**
 * Create a notification for a single person
 * Respects mute settings - returns null if user has muted the event/post
 */
export async function notifyPerson(
  ctx: MutationCtx,
  data: {
    personId: Id<'persons'>;
    type: NotificationType;
    authorId?: Id<'persons'>;
    eventId?: Id<'events'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
  }
): Promise<{
  notificationId: Id<'notifications'> | null;
  skippedMuted: boolean;
}> {
  // Don't notify someone about their own action
  if (data.authorId && data.personId === data.authorId) {
    return { notificationId: null, skippedMuted: false };
  }

  // Check if user has muted this event or post
  const shouldSkip = await shouldSkipNotificationDueToMute(
    ctx,
    data.personId,
    data.eventId,
    data.postId
  );

  if (shouldSkip) {
    return { notificationId: null, skippedMuted: true };
  }

  const notificationId = await createNotification(ctx, data);
  return { notificationId, skippedMuted: false };
}

/**
 * Check if a user is currently present in a post room
 * Used to skip notifications for users actively viewing the thread
 */
export async function isUserPresentInPost(
  ctx: MutationCtx,
  postId: Id<'posts'>,
  personId: Id<'persons'>
): Promise<boolean> {
  try {
    const roomId = `post:${postId}`;
    const roomData = await presence.listRoom(ctx, roomId, true); // onlineOnly = true
    return roomData.some(user => user.userId === (personId as string));
  } catch {
    // If presence check fails, assume user is not present
    // This ensures notifications are sent even if presence is down
    return false;
  }
}

/**
 * Notify thread participants about a new reply, skipping users who are actively viewing
 * Respects mute settings - skips users who have muted the event or post
 *
 * @param ctx - Mutation context
 * @param data - Notification data including post and author info
 * @returns Object with counts of notifications sent, skipped due to presence, and skipped due to muting
 */
export async function notifyThreadParticipants(
  ctx: MutationCtx,
  data: {
    postId: Id<'posts'>;
    eventId: Id<'events'>;
    postAuthorId: Id<'persons'>;
    replyAuthorId: Id<'persons'>;
  }
): Promise<{ sent: number; skippedPresent: number; skippedMuted: number }> {
  let sent = 0;
  let skippedPresent = 0;
  let skippedMuted = 0;

  // Get users currently present in the post room
  let presentUsers: string[] = [];
  try {
    const roomId = `post:${data.postId}`;
    const roomData = await presence.listRoom(ctx, roomId, true); // onlineOnly = true
    presentUsers = roomData.map(user => user.userId);
  } catch {
    // If presence check fails, continue without it
    presentUsers = [];
  }

  const presentUserSet = new Set(presentUsers);

  // Notify the post author (if not the reply author and not present)
  if (data.postAuthorId !== data.replyAuthorId) {
    if (presentUserSet.has(data.postAuthorId as string)) {
      skippedPresent++;
    } else {
      // Check if user has muted this event or post
      const shouldSkip = await shouldSkipNotificationDueToMute(
        ctx,
        data.postAuthorId,
        data.eventId,
        data.postId
      );

      if (shouldSkip) {
        skippedMuted++;
      } else {
        await createNotification(ctx, {
          personId: data.postAuthorId,
          type: 'NEW_REPLY',
          authorId: data.replyAuthorId,
          eventId: data.eventId,
          postId: data.postId,
        });
        sent++;
      }
    }
  }

  // Get all existing replies to find other participants
  const existingReplies = await ctx.db
    .query('replies')
    .withIndex('by_post', q => q.eq('postId', data.postId))
    .collect();

  // Track who we've already notified (or skipped)
  const processedAuthors = new Set<string>([
    data.replyAuthorId as string,
    data.postAuthorId as string,
  ]);

  // Notify each unique reply author
  for (const reply of existingReplies) {
    if (!processedAuthors.has(reply.authorId as string)) {
      processedAuthors.add(reply.authorId as string);

      if (presentUserSet.has(reply.authorId as string)) {
        skippedPresent++;
      } else {
        // Check if user has muted this event or post
        const shouldSkip = await shouldSkipNotificationDueToMute(
          ctx,
          reply.authorId,
          data.eventId,
          data.postId
        );

        if (shouldSkip) {
          skippedMuted++;
        } else {
          await createNotification(ctx, {
            personId: reply.authorId,
            type: 'NEW_REPLY',
            authorId: data.replyAuthorId,
            eventId: data.eventId,
            postId: data.postId,
          });
          sent++;
        }
      }
    }
  }

  return { sent, skippedPresent, skippedMuted };
}

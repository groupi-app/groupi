import { Effect, Schedule } from 'effect';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import { getPrismaError } from '../shared/errors';
import { ConnectionError, NotFoundError } from '@groupi/schema';
import {
  NotificationType,
  NotificationMethodType,
  WebhookFormat,
} from '@prisma/client';
import { resend } from '../infrastructure/email';
import { getRESEND_FROM_EMAIL } from '../infrastructure/env';
import { generateWebhookPayload } from '../infrastructure/webhook-templates';
import type { WebhookNotificationData } from '@groupi/schema';
import { getNotificationSubject } from '../infrastructure/notification-utils';
import { sendPusherBeamsNotification } from '../infrastructure/pusher-beams-server';
import { getNEXT_PUBLIC_BASE_URL } from '../infrastructure/env';
import { render } from '@react-email/render';
import { NotificationEmailTemplate } from '@groupi/ui/email';
import React from 'react';

/**
 * Process and send notifications for a specific notification ID
 * This function:
 * 1. Fetches the notification with all relations
 * 2. Finds enabled notification methods for the user
 * 3. Sends emails for EMAIL methods
 * 4. Sends webhooks for WEBHOOK methods
 */
export const processNotificationDelivery = async (
  notificationId: string
): Promise<{
  emailsSent: number;
  webhooksSent: number;
  pushesSent: number;
}> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Processing notification delivery', {
      notificationId,
    });

    // Fetch notification with all relations
    const notification = yield* Effect.promise(() =>
      db.notification.findUnique({
        where: { id: notificationId },
        select: {
          id: true,
          type: true,
          read: true,
          createdAt: true,
          datetime: true,
          rsvp: true,
          personId: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Notification', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'processNotificationDelivery.fetchNotification',
          notificationId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!notification) {
      yield* Effect.fail(
        new NotFoundError({
          message: `Notification not found`,
          cause: notificationId,
        })
      );
      return { emailsSent: 0, webhooksSent: 0, pushesSent: 0 };
    }

    // Fetch user's notification methods
    const settings = yield* Effect.promise(() =>
      db.personSettings.findUnique({
        where: { personId: notification.personId },
        select: {
          notificationMethods: {
            where: {
              enabled: true,
            },
            select: {
              id: true,
              type: true,
              value: true,
              name: true,
              webhookFormat: true,
              customTemplate: true,
              webhookHeaders: true,
              notifications: {
                where: {
                  enabled: true,
                  notificationType: notification.type,
                },
                select: {
                  notificationType: true,
                },
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) =>
        getPrismaError('PersonSettings', cause)
      ),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'processNotificationDelivery.fetchSettings',
          notificationId,
          personId: notification.personId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!settings || settings.notificationMethods.length === 0) {
      yield* Effect.logInfo('No enabled notification methods found', {
        notificationId,
        personId: notification.personId,
      });
      return { emailsSent: 0, webhooksSent: 0, pushesSent: 0 };
    }

    // Filter methods that have this notification type enabled
    const relevantMethods = settings.notificationMethods.filter(
      method => method.notifications.length > 0
    );

    if (relevantMethods.length === 0) {
      yield* Effect.logInfo('No notification methods enabled for this type', {
        notificationId,
        personId: notification.personId,
        notificationType: notification.type,
      });
      return { emailsSent: 0, webhooksSent: 0, pushesSent: 0 };
    }

    // Get user's current email (for EMAIL methods that might have empty value)
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: notification.personId },
        select: { email: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.catchAll(() => Effect.succeed(null)) // Don't fail if user fetch fails
    );

    let emailsSent = 0;
    let webhooksSent = 0;
    let pushesSent = 0;

    // Process each notification method
    for (const method of relevantMethods) {
      try {
        if (method.type === NotificationMethodType.PUSH) {
          // Send push notification via Pusher Beams
          yield* Effect.promise(() =>
            sendPushNotification(notification, notification.personId)
          ).pipe(
            Effect.tapError((error: unknown) =>
              Effect.logError('Failed to send push notification', {
                notificationId,
                methodId: method.id,
                personId: notification.personId,
                error: error instanceof Error ? error.message : String(error),
              })
            ),
            Effect.catchAll(() => Effect.succeed(null)) // Don't fail on push errors
          );

          pushesSent++;
        } else if (method.type === NotificationMethodType.EMAIL) {
          // Resolve email address (use value if set, otherwise use user's email)
          const emailAddress =
            method.value && method.value.trim() !== ''
              ? method.value
              : user?.email;

          if (!emailAddress) {
            yield* Effect.logWarning(
              'No email address available for EMAIL method',
              {
                notificationId,
                methodId: method.id,
                personId: notification.personId,
              }
            );
            continue;
          }

          // Send email notification
          yield* Effect.promise(() =>
            sendEmailNotification(notification, emailAddress)
          ).pipe(
            Effect.tapError((error: unknown) =>
              Effect.logError('Failed to send email notification', {
                notificationId,
                methodId: method.id,
                emailAddress,
                error: error instanceof Error ? error.message : String(error),
              })
            ),
            Effect.catchAll(() => Effect.succeed(null)) // Don't fail on email errors
          );

          emailsSent++;
        } else if (method.type === NotificationMethodType.WEBHOOK) {
          if (!method.value || method.value.trim() === '') {
            yield* Effect.logWarning('No webhook URL for WEBHOOK method', {
              notificationId,
              methodId: method.id,
              personId: notification.personId,
            });
            continue;
          }

          if (!method.webhookFormat) {
            yield* Effect.logWarning('No webhook format for WEBHOOK method', {
              notificationId,
              methodId: method.id,
              personId: notification.personId,
            });
            continue;
          }

          // Send webhook notification
          yield* Effect.promise(() =>
            sendWebhookNotification(
              notification,
              method.value,
              method.webhookFormat as WebhookFormat,
              method.customTemplate || undefined,
              method.webhookHeaders
                ? typeof method.webhookHeaders === 'string'
                  ? JSON.parse(method.webhookHeaders)
                  : method.webhookHeaders
                : undefined
            )
          ).pipe(
            Effect.tapError((error: unknown) =>
              Effect.logError('Failed to send webhook notification', {
                notificationId,
                methodId: method.id,
                webhookUrl: method.value,
                error: error instanceof Error ? error.message : String(error),
              })
            ),
            Effect.catchAll(() => Effect.succeed(null)) // Don't fail on webhook errors
          );

          webhooksSent++;
        }
      } catch (error) {
        // Log but continue processing other methods
        yield* Effect.logError('Error processing notification method', {
          notificationId,
          methodId: method.id,
          methodType: method.type,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    yield* Effect.logInfo('Notification delivery processed', {
      notificationId,
      personId: notification.personId,
      emailsSent,
      webhooksSent,
      pushesSent,
    });

    return { emailsSent, webhooksSent, pushesSent };
  });

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('notification-sender'))
  );
};

/**
 * Send email notification via Resend
 */
async function sendEmailNotification(
  notification: {
    id: string;
    type: NotificationType;
    createdAt: Date;
    datetime: Date | null;
    rsvp: string | null;
    event: { id: string; title: string } | null;
    post: { id: string; title: string } | null;
    author: {
      user: {
        name: string | null;
        email: string;
        image: string | null;
      };
    } | null;
  },
  toEmail: string
): Promise<void> {
  // Convert notification to NotificationFeedData format for the React component
  const notificationData = {
    id: notification.id,
    type: notification.type,
    read: false,
    createdAt: notification.createdAt,
    datetime: notification.datetime,
    rsvp: notification.rsvp as 'YES' | 'MAYBE' | 'NO' | 'PENDING' | null,
    event: notification.event
      ? {
          id: notification.event.id,
          title: notification.event.title,
        }
      : null,
    post: notification.post
      ? {
          id: notification.post.id,
          title: notification.post.title,
        }
      : null,
    author: notification.author
      ? {
          id: notification.author.user.email, // Using email as ID fallback
          user: {
            name: notification.author.user.name,
            email: notification.author.user.email,
            image: notification.author.user.image,
          },
        }
      : null,
  };

  const subject = getNotificationSubject(notificationData);

  // Render React Email component to HTML using @react-email/render
  const html = await render(
    React.createElement(NotificationEmailTemplate, {
      notification: notificationData,
    })
  );

  await resend.emails.send({
    from: getRESEND_FROM_EMAIL(),
    to: toEmail,
    subject,
    html,
  });
}

/**
 * Send webhook notification via HTTP POST
 */
async function sendWebhookNotification(
  notification: {
    id: string;
    type: NotificationType;
    createdAt: Date;
    datetime: Date | null;
    rsvp: string | null;
    event: { id: string; title: string } | null;
    post: { id: string; title: string } | null;
    author: {
      user: {
        name: string | null;
        email: string;
        image: string | null;
      };
    } | null;
  },
  webhookUrl: string,
  webhookFormat: WebhookFormat,
  customTemplate?: string,
  customHeaders?: Record<string, string>
): Promise<void> {
  // Convert notification to WebhookNotificationData format
  const webhookNotificationData: WebhookNotificationData = {
    id: notification.id,
    type: notification.type,
    read: false,
    createdAt: notification.createdAt,
    datetime: notification.datetime,
    rsvp: notification.rsvp as 'YES' | 'MAYBE' | 'NO' | 'PENDING' | null,
    event: notification.event
      ? {
          id: notification.event.id,
          title: notification.event.title,
        }
      : null,
    post: notification.post
      ? {
          id: notification.post.id,
          title: notification.post.title,
        }
      : null,
    author: notification.author
      ? {
          id: notification.author.user.email, // Using email as ID fallback
          user: {
            name: notification.author.user.name,
            email: notification.author.user.email,
            image: notification.author.user.image,
          },
        }
      : null,
  };

  const { payload, headers } = generateWebhookPayload(
    webhookNotificationData,
    webhookFormat,
    customTemplate
  );

  // Merge custom headers with default headers
  const finalHeaders = {
    ...headers,
    ...customHeaders,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: finalHeaders,
    body: payload,
  });

  if (!response.ok) {
    throw new Error(
      `Webhook request failed: ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Send push notification via Pusher Beams
 */
async function sendPushNotification(
  notification: {
    id: string;
    type: NotificationType;
    createdAt: Date;
    datetime: Date | null;
    rsvp: string | null;
    event: { id: string; title: string } | null;
    post: { id: string; title: string } | null;
    author: {
      user: {
        name: string | null;
        email: string;
        image: string | null;
      };
    } | null;
  },
  userId: string
): Promise<void> {
  const baseUrl = getNEXT_PUBLIC_BASE_URL();

  // Get notification title and body
  const subject = getNotificationSubject({
    type: notification.type,
    event: notification.event,
    post: notification.post,
    author: notification.author,
    rsvp: notification.rsvp,
  });

  // Get notification body/message
  const getNotificationBody = () => {
    const { type, event, post, author, rsvp } = notification;
    const getAuthorName = () => {
      if (!author?.user) return 'Someone';
      return author.user.name || author.user.email?.split('@')[0] || 'Someone';
    };

    switch (type) {
      case 'EVENT_EDITED':
        return `The details of ${event?.title || 'an event'} have been updated.`;
      case 'DATE_CHANGED':
        return `The date of ${event?.title || 'an event'} has changed.`;
      case 'DATE_CHOSEN':
        return `${event?.title || 'An event'} will be held on ${notification.datetime ? new Date(notification.datetime).toLocaleString() : 'a date'}.`;
      case 'DATE_RESET':
        return `A new poll has started for the date of ${event?.title || 'an event'}.`;
      case 'NEW_POST':
        return `${getAuthorName()} created a new post, ${post?.title || 'a post'}, in ${event?.title || 'an event'}.`;
      case 'NEW_REPLY':
        return `${getAuthorName()} replied to a post, ${post?.title || 'a post'}, in ${event?.title || 'an event'}.`;
      case 'USER_MENTIONED':
        return `${getAuthorName()} mentioned you in ${post?.title || 'a post'}.`;
      case 'USER_JOINED':
        return `${getAuthorName()} has joined ${event?.title || 'an event'}.`;
      case 'USER_LEFT':
        return `${getAuthorName()} has left ${event?.title || 'an event'}.`;
      case 'USER_PROMOTED':
        return `You are now a Moderator of ${event?.title || 'an event'}.`;
      case 'USER_DEMOTED':
        return `You are no longer a Moderator of ${event?.title || 'an event'}.`;
      case 'USER_RSVP':
        return `${getAuthorName()} has RSVP'd ${rsvp || 'responded'} to ${event?.title || 'an event'}.`;
      default:
        return 'You have a new notification from Groupi.';
    }
  };

  // Get notification URL
  const getNotificationUrl = () => {
    switch (notification.type) {
      case 'EVENT_EDITED':
      case 'DATE_CHOSEN':
      case 'DATE_CHANGED':
      case 'DATE_RESET':
      case 'USER_JOINED':
      case 'USER_LEFT':
      case 'USER_PROMOTED':
      case 'USER_DEMOTED':
      case 'USER_RSVP':
        return notification.event
          ? `${baseUrl}/event/${notification.event.id}`
          : undefined;
      case 'NEW_POST':
      case 'NEW_REPLY':
      case 'USER_MENTIONED':
        return notification.post
          ? `${baseUrl}/post/${notification.post.id}`
          : undefined;
      default:
        return notification.event
          ? `${baseUrl}/event/${notification.event.id}`
          : undefined;
    }
  };

  const result = await sendPusherBeamsNotification(userId, {
    title: subject,
    body: getNotificationBody(),
    url: getNotificationUrl(),
    data: {
      notificationId: notification.id,
      type: notification.type,
      eventId: notification.event?.id,
      postId: notification.post?.id,
    },
    tag: notification.id, // Use notification ID as tag for grouping
  });

  if (result.error) {
    throw new Error(result.error);
  }
}

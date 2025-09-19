import {
  NotificationWithPersonEventPost,
  NotificationFeedDTO,
  createNotificationFeedDTO,
  NotificationSchema,
} from '@groupi/schema';
import {
  $Enums,
  Membership,
  Notification,
  NotificationMethod,
  NotificationType,
} from '@prisma/client';

import { BatchEvent } from 'pusher';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { getNotificationQuery } from '@groupi/schema/queries';
import { resend } from './email';
// import { NotificationEmailTemplate } from '@groupi/ui/email';
import { getNotificationSubject } from './notification-utils';
import { getNEXT_PUBLIC_BASE_URL, getRESEND_FROM_EMAIL } from './env';
import { Effect } from 'effect';
import { z } from 'zod';
import { SentryHelpers } from './sentry';
import { safeWrapper } from './shared/safe-wrapper';

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
  businessLogicOperation,
} from './shared/effect-patterns';
import { OperationSuccessSchema } from './shared/operations';

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for notification feed data returned to clients
export const NotificationFeedDataSchema = z.object({
  notifications: z.array(NotificationFeedDTO),
});

// Schema for notification count operations
export const NotificationCountSchema = z.object({
  count: z.number(),
});

// Schema for external notification results
export const ExternalNotificationResultSchema = z.object({
  success: z.string(),
});

// Error types for notification operations
export class NotificationNotFoundError extends Error {
  readonly _tag = 'NotificationNotFoundError';
  constructor(notificationId: string) {
    super(`Notification not found: ${notificationId}`);
  }
}

export class NotificationUserNotFoundError extends Error {
  readonly _tag = 'NotificationUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class NotificationUnauthorizedError extends Error {
  readonly _tag = 'NotificationUnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}

export class NotificationCreationError extends Error {
  readonly _tag = 'NotificationCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create notification');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class NotificationUpdateError extends Error {
  readonly _tag = 'NotificationUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update notification');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class NotificationDeletionError extends Error {
  readonly _tag = 'NotificationDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete notification');
    if (cause) {
      this.cause = cause;
    }
  }
}

// Type guard functions for notification errors
export const isNotificationNotFoundError = (
  error: Error
): error is NotificationNotFoundError =>
  error instanceof NotificationNotFoundError;

export const isNotificationUserNotFoundError = (
  error: Error
): error is NotificationUserNotFoundError =>
  error instanceof NotificationUserNotFoundError;

export const isNotificationUnauthorizedError = (
  error: Error
): error is NotificationUnauthorizedError =>
  error instanceof NotificationUnauthorizedError;

export const isNotificationCreationError = (
  error: Error
): error is NotificationCreationError =>
  error instanceof NotificationCreationError;

export const isNotificationUpdateError = (
  error: Error
): error is NotificationUpdateError => error instanceof NotificationUpdateError;

export const isNotificationDeletionError = (
  error: Error
): error is NotificationDeletionError =>
  error instanceof NotificationDeletionError;

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to fetch notifications for person
export const fetchNotificationsForPersonEffect = (
  userId: string,
  requestingUserId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Authorization check (business logic - no retry)
      if (requestingUserId !== userId) {
        return yield* _(
          Effect.fail(
            new NotificationUnauthorizedError(
              "You are not authorized to view this user's notifications"
            )
          )
        );
      }

      // Fetch person with notifications (database operation with retry)
      const person = yield* _(
        dbOperation(
          () =>
            db.person.findUnique({
              where: { id: userId },
              select: {
                notifications: {
                  include: {
                    person: true,
                    event: true,
                    post: true,
                    author: true,
                  },
                },
              },
            }),
          _error => new NotificationNotFoundError(userId),
          `Fetch notifications for person: ${userId}`
        )
      );

      if (!person) {
        return yield* _(Effect.fail(new NotificationNotFoundError(userId)));
      }

      return person.notifications;
    }),
    'notification',
    'fetchNotificationsForPerson',
    userId
  );

// Modernized Effect-based function to mark notification as read
export const markNotificationAsReadEffect = (
  notificationId: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Update notification as read (database operation with retry)
      const notification = yield* _(
        dbOperation(
          () =>
            db.notification.update({
              where: {
                id: notificationId,
                personId: userId,
              },
              data: {
                read: true,
              },
              include: {
                person: true,
                event: true,
                post: true,
                author: true,
              },
            }),
          _error => new NotificationUpdateError(_error),
          `Mark notification as read: ${notificationId}`
        )
      );

      if (!notification) {
        return yield* _(
          Effect.fail(new NotificationNotFoundError(notificationId))
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for read update: ${notificationId}`
        )
      );

      return notification;
    }),
    'notification',
    'markNotificationAsRead',
    notificationId
  );

// Modernized Effect-based function to mark all notifications as read
export const markAllNotificationsAsReadEffect = (userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Update all notifications as read (database operation with retry)
      const notifications = yield* _(
        dbOperation(
          () =>
            db.notification.updateMany({
              where: {
                personId: userId,
              },
              data: {
                read: true,
              },
            }),
          _error => new NotificationUpdateError(_error),
          `Mark all notifications as read for user: ${userId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for mark all read: ${userId}`
        )
      );

      return notifications.count;
    }),
    'notification',
    'markAllNotificationsAsRead',
    userId
  );

// Modernized Effect-based function to create notification
export const createNotificationEffect = (
  notificationData: Omit<
    Notification,
    'id' | 'createdAt' | 'updatedAt' | 'author'
  >,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      let membership: Membership | undefined = undefined;

      if (notificationData.eventId) {
        // Fetch event with memberships (database operation with retry)
        const event = yield* _(
          dbOperation(
            () =>
              db.event.findUnique({
                where: { id: notificationData.eventId! },
                include: { memberships: true },
              }),
            _error => new Error('Failed to fetch event'),
            `Fetch event for notification: ${notificationData.eventId}`
          )
        );

        if (!event) {
          return yield* _(Effect.fail(new Error('Event not found')));
        }

        membership = event.memberships.find(
          membership => membership.personId === userId
        );
      } else if (notificationData.postId) {
        // Fetch post with event memberships (database operation with retry)
        const post = yield* _(
          dbOperation(
            () =>
              db.post.findUnique({
                where: { id: notificationData.postId! },
                include: {
                  event: {
                    include: { memberships: true },
                  },
                },
              }),
            _error => new Error('Failed to fetch post'),
            `Fetch post for notification: ${notificationData.postId}`
          )
        );

        if (!post) {
          return yield* _(Effect.fail(new Error('Post not found')));
        }

        membership = post.event.memberships.find(
          membership => membership.personId === userId
        );
      }

      if (!membership) {
        return yield* _(Effect.fail(new Error('User not in event')));
      }

      // Create the notification (database operation with retry)
      const newNotification = yield* _(
        dbOperation(
          () =>
            db.notification.create({
              data: {
                ...notificationData,
                authorId: userId,
              },
              include: {
                person: true,
                event: true,
                post: true,
                author: true,
              },
            }),
          _error => new NotificationCreationError(_error),
          `Create notification for user: ${notificationData.personId}`
        )
      );

      // Send external notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          async () => {
            const result = await sendExternalNotificationsEffect(
              newNotification
            ).pipe(Effect.runPromise);
            return result;
          },
          _error => new Error('Failed to send external notifications'),
          `Send external notifications for: ${newNotification.id}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(
              newNotification.personId
            );
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for new notification: ${newNotification.id}`
        )
      );

      return newNotification;
    }),
    'notification',
    'createNotification',
    notificationData.personId
  );

// Modernized Effect-based function to create event notifications
export const createEventNotifsEffect = (
  eventId: string,
  type: Exclude<NotificationType, 'NEW_REPLY'>,
  userId: string,
  postId?: string,
  datetime?: Date
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: { memberships: true },
            }),
          _error => new Error('Failed to fetch event'),
          `Fetch event for notifications: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new Error('Event not found')));
      }

      // Check if user is in the event (business logic - no retry)
      const membership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!membership) {
        return yield* _(Effect.fail(new Error('User not in event')));
      }

      const personIds = event.memberships
        .filter(membership => membership.personId !== userId)
        .map(membership => membership.personId);

      // Create notifications efficiently with createMany (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.notification.createMany({
              data: personIds.map(personId => ({
                personId,
                eventId,
                postId,
                type: type,
                authorId: userId,
                datetime,
              })),
            }),
          _error => new NotificationCreationError(_error),
          `Create event notifications for: ${eventId}`
        )
      );

      // Fetch the created notifications with full details for external notifications
      const createdNotifications = yield* _(
        dbOperation(
          () =>
            db.notification.findMany({
              where: {
                personId: { in: personIds },
                eventId,
                type,
                authorId: userId,
                createdAt: { gte: new Date(Date.now() - 1000) }, // Created within last second
              },
              include: {
                person: true,
                event: true,
                post: true,
                author: true,
              },
            }),
          _error => new Error('Failed to fetch created notifications'),
          `Fetch created notifications for external processing: ${eventId}`
        )
      );

      // Send external notifications for each created notification
      for (const notification of createdNotifications) {
        yield* _(
          externalServiceOperation(
            async () => {
              const result = await sendExternalNotificationsEffect(
                notification
              ).pipe(Effect.runPromise);
              return result;
            },
            _error => new Error('Failed to send external notifications'),
            `Send external notifications for notification: ${notification.id}`
          )
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      const events: BatchEvent[] = [];
      for (const personId of personIds) {
        const notificationQueryDefinition = getNotificationQuery(personId);
        events.push({
          channel: notificationQueryDefinition.pusherChannel,
          name: notificationQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        });
      }

      if (events.length > 0) {
        yield* _(
          externalServiceOperation(
            () => getPusherServer().triggerBatch(events),
            _error => new Error('Failed to send pusher notifications'),
            `Send pusher notifications for event notifications: ${eventId}`
          )
        );
      }

      return createdNotifications.length;
    }),
    'notification',
    'createEventNotifs',
    eventId
  );

// Modernized Effect-based function to send external notifications
export const sendExternalNotificationsEffect = (
  notification: NotificationWithPersonEventPost
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      const userId = notification.personId;

      if (!userId) {
        return yield* _(
          Effect.fail(new Error('User ID not found in notification'))
        );
      }

      // Route given notification to given services based on user's notification settings
      const person = yield* _(
        dbOperation(
          () =>
            db.person.findUnique({
              where: { id: userId },
              include: {
                settings: {
                  include: {
                    notificationMethods: {
                      include: {
                        notifications: true,
                      },
                    },
                  },
                },
              },
            }),
          _error => new Error('Failed to fetch person settings'),
          `Fetch person settings for external notifications: ${userId}`
        )
      );

      if (!person) {
        return yield* _(Effect.fail(new Error('Person not found')));
      }

      if (!person.settings) {
        return yield* _(Effect.fail(new Error('Settings not found')));
      }

      const methods = person.settings.notificationMethods.filter(method =>
        method.notifications.some(
          notif => notif.notificationType === notification.type && notif.enabled
        )
      );

      const results: { method: string; success: boolean; error?: string }[] =
        [];

      for (const method of methods.filter(m => m.enabled)) {
        switch (method.type) {
          case 'EMAIL': {
            try {
              yield* _(
                externalServiceOperation(
                  async () => {
                    const result = await sendEmailNotificationEffect(
                      notification,
                      method
                    ).pipe(Effect.runPromise);
                    return result;
                  },
                  _error =>
                    new Error(
                      `Failed to send email notification: ${_error instanceof Error ? _error.message : 'Unknown error'}`
                    ),
                  `Send email notification: ${notification.id}`
                )
              );
              results.push({ method: 'EMAIL', success: true });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              results.push({
                method: 'EMAIL',
                success: false,
                error: errorMessage,
              });
            }
            break;
          }
          case 'PUSH': {
            try {
              yield* _(
                externalServiceOperation(
                  async () => {
                    const result = await sendPushNotificationToUserEffect(
                      notification,
                      method.value
                    ).pipe(Effect.runPromise);
                    return result;
                  },
                  _error =>
                    new Error(
                      `Failed to send push notification: ${_error instanceof Error ? _error.message : 'Unknown error'}`
                    ),
                  `Send push notification: ${notification.id}`
                )
              );
              results.push({ method: 'PUSH', success: true });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              results.push({
                method: 'PUSH',
                success: false,
                error: errorMessage,
              });
            }
            break;
          }
          case 'WEBHOOK': {
            try {
              yield* _(
                externalServiceOperation(
                  async () => {
                    const result = await sendWebhookNotificationEffect(
                      notification,
                      method
                    ).pipe(Effect.runPromise);
                    return result;
                  },
                  _error =>
                    new Error(
                      `Failed to send webhook notification: ${_error instanceof Error ? _error.message : 'Unknown error'}`
                    ),
                  `Send webhook notification: ${notification.id}`
                )
              );
              results.push({ method: 'WEBHOOK', success: true });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              results.push({
                method: 'WEBHOOK',
                success: false,
                error: errorMessage,
              });
            }
            break;
          }
          default:
            results.push({
              method: method.type,
              success: false,
              error: 'Unknown method type',
            });
        }
      }

      const failedMethods = results.filter(r => !r.success);
      const successfulMethods = results.filter(r => r.success);

      if (failedMethods.length > 0 && successfulMethods.length === 0) {
        return `All notification methods failed: ${failedMethods.map(f => `${f.method}: ${f.error}`).join(', ')}`;
      } else if (failedMethods.length > 0) {
        return `Partial success: ${successfulMethods.length}/${methods.length} methods succeeded`;
      } else {
        return `All ${methods.length} notification methods sent successfully`;
      }
    }),
    'notification',
    'sendExternalNotifications',
    notification.id
  );

// Modernized Effect-based function to send email notification
export const sendEmailNotificationEffect = (
  notification: NotificationWithPersonEventPost,
  method: NotificationMethod
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      if (!notification) {
        return yield* _(
          Effect.fail(new Error('Notification details are required'))
        );
      }

      // Generate email subject (business logic - no retry)
      const emailSubject = getNotificationSubject(notification);
      const fromEmail = getRESEND_FROM_EMAIL();

      // Send email via Resend (external service with retry)
      const result = yield* _(
        externalServiceOperation(
          async () => {
            const response = await resend.emails.send({
              from: fromEmail,
              to: method.value,
              subject: emailSubject,
              // react: NotificationEmailTemplate({
              //   notification: createNotificationFeedDTO(notification),
              // }),
              html: `<p>Notification: ${createNotificationFeedDTO(notification).type}</p>`,
            });

            if (response.error) {
              throw new Error(
                `Failed to send email: ${response.error.message || 'Unknown error'}`
              );
            }

            if (!response.data) {
              throw new Error('No data returned from email service');
            }

            return response.data;
          },
          _error =>
            new Error(
              `Email sending failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`
            ),
          `Send email notification via Resend: ${notification.id}`
        )
      );

      return { success: result };
    }),
    'notification',
    'sendEmailNotification',
    notification.id
  );

// Modernized Effect-based function to send webhook notification
export const sendWebhookNotificationEffect = (
  notification: NotificationWithPersonEventPost,
  method: NotificationMethod
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Generate webhook payload using the template system (business logic - no retry)
      const { generateWebhookPayload } = yield* _(
        businessLogicOperation(
          () => import('./webhook-templates'),
          _error =>
            new Error(
              `Failed to import webhook templates: ${_error instanceof Error ? _error.message : 'Unknown error'}`
            ),
          'Import webhook templates'
        )
      );

      const { payload, headers: defaultHeaders } = generateWebhookPayload(
        notification,
        method.webhookFormat || 'GENERIC',
        method.customTemplate || undefined
      );

      // Parse custom headers if provided (business logic - no retry)
      let customHeaders: Record<string, string> = {};
      if (method.webhookHeaders) {
        try {
          const headersStr =
            typeof method.webhookHeaders === 'string'
              ? method.webhookHeaders
              : JSON.stringify(method.webhookHeaders);
          customHeaders = JSON.parse(headersStr);
        } catch {
          // Use default headers only if parsing fails
        }
      }

      const finalHeaders = { ...defaultHeaders, ...customHeaders };

      // Send the webhook (external service with retry)
      const response = yield* _(
        externalServiceOperation(
          async () => {
            const res = await fetch(method.value, {
              method: 'POST',
              headers: finalHeaders,
              body: payload,
            });

            if (!res.ok) {
              const errorText = await res.text().catch(() => 'Unknown error');
              throw new Error(
                `HTTP ${res.status}: ${res.statusText} - ${errorText}`
              );
            }

            return 'Webhook notification sent successfully';
          },
          _error =>
            new Error(
              `Webhook failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`
            ),
          `Send webhook notification: ${notification.id}`
        )
      );

      return { success: response };
    }),
    'notification',
    'sendWebhookNotification',
    notification.id
  );

// Modernized Effect-based function to send push notification to user
export const sendPushNotificationToUserEffect = (
  notification: NotificationWithPersonEventPost,
  targetUserId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Generate push notification payload (business logic - no retry)
      const payload = generatePushNotificationPayload(notification);

      // Use Pusher Beams to send notification to authenticated user (external service with retry)
      const result = yield* _(
        externalServiceOperation(
          async () => {
            const { sendPusherBeamsNotification } = await import(
              './pusher-beams-server'
            );

            const response = await sendPusherBeamsNotification(targetUserId, {
              title: payload.title,
              body: payload.body,
              data: payload.data,
              url: payload.url,
              tag: payload.tag,
            });

            if (response.error) {
              throw new Error(response.error);
            }

            return response.success || 'Push notification sent successfully';
          },
          _error =>
            new Error(
              `Push notification failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`
            ),
          `Send push notification via Pusher Beams: ${notification.id}`
        )
      );

      return { success: result };
    }),
    'notification',
    'sendPushNotificationToUser',
    notification.id
  );

// ============================================================================
// PUBLIC API FUNCTIONS (Safe Wrapper Pattern)
// ============================================================================

export const fetchNotificationsForPerson = safeWrapper<
  [string, string],
  NotificationWithPersonEventPost[],
  NotificationNotFoundError | NotificationUnauthorizedError
>(
  (userId: string, requestingUserId: string) =>
    Effect.runPromise(
      fetchNotificationsForPersonEffect(userId, requestingUserId)
    ),
  z.array(z.any()) // TODO: Create proper schema for NotificationWithPersonEventPost
);

export const markNotificationAsRead = safeWrapper<
  [string, string],
  NotificationWithPersonEventPost,
  NotificationNotFoundError | NotificationUpdateError
>(
  async (notificationId: string, userId: string) => {
    const result = await Effect.runPromise(
      markNotificationAsReadEffect(notificationId, userId)
    );

    // Send real-time invalidation (fire-and-forget)
    import('./realtime-invalidation')
      .then(({ invalidateNotificationQueries }) => {
        invalidateNotificationQueries([userId], 'notification.read', {
          notificationId,
          userId,
          action: 'read',
        });
      })
      .catch(() => {
        // Silently handle invalidation errors
      });

    return result;
  },
  z.any() // TODO: Create proper schema for NotificationWithPersonEventPost
);

export const markAllNotificationsAsRead = safeWrapper<
  [string],
  z.infer<typeof NotificationCountSchema>,
  NotificationUpdateError
>(async (userId: string) => {
  const count = await Effect.runPromise(
    markAllNotificationsAsReadEffect(userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateNotificationQueries }) => {
      invalidateNotificationQueries([userId], 'notification.read', {
        userId,
        action: 'mark_all_read',
        count,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return { count };
}, NotificationCountSchema);

export const createNotification = safeWrapper<
  [Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'author'>, string],
  NotificationWithPersonEventPost,
  NotificationCreationError
>(
  async (
    notificationData: Omit<
      Notification,
      'id' | 'createdAt' | 'updatedAt' | 'author'
    >,
    userId: string
  ) => {
    const result = await Effect.runPromise(
      createNotificationEffect(notificationData, userId)
    );

    // Send real-time invalidation (fire-and-forget)
    import('./realtime-invalidation')
      .then(({ invalidateNotificationQueries }) => {
        invalidateNotificationQueries(
          [notificationData.personId],
          'notification.created',
          {
            notificationId: result.id,
            type: notificationData.type,
            eventId: notificationData.eventId,
            postId: notificationData.postId,
            recipientId: notificationData.personId,
            authorId: userId,
          }
        );
      })
      .catch(() => {
        // Silently handle invalidation errors
      });

    return result;
  },
  z.any() // TODO: Create proper schema for NotificationWithPersonEventPost
);

export const createEventNotifs = safeWrapper<
  [string, Exclude<NotificationType, 'NEW_REPLY'>, string, string?, Date?],
  z.infer<typeof NotificationCountSchema>,
  NotificationCreationError
>(
  async (
    eventId: string,
    type: Exclude<NotificationType, 'NEW_REPLY'>,
    userId: string,
    postId?: string,
    datetime?: Date
  ) => {
    const count = await Effect.runPromise(
      createEventNotifsEffect(eventId, type, userId, postId, datetime)
    );
    return { count };
  },
  NotificationCountSchema
);

export const sendExternalNotifications = safeWrapper<
  [NotificationWithPersonEventPost],
  z.infer<typeof ExternalNotificationResultSchema>,
  Error
>(async (notification: NotificationWithPersonEventPost) => {
  const success = await Effect.runPromise(
    sendExternalNotificationsEffect(notification)
  );
  return { success };
}, ExternalNotificationResultSchema);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate push notification payload helper function
const generatePushNotificationPayload = (
  notification: NotificationWithPersonEventPost
) => {
  const { event, post, type, datetime, author, rsvp } = notification;

  const getNotificationLink = () => {
    const baseUrl = getNEXT_PUBLIC_BASE_URL();
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

  const getNotificationTitleAndBody = () => {
    const authorName =
      author?.firstName || author?.lastName || author?.username || 'Someone';

    switch (type) {
      case 'EVENT_EDITED':
        return {
          title: `Event Updated: ${event?.title}`,
          body: `The details of ${event?.title} have been updated.`,
        };
      case 'DATE_CHANGED':
        return {
          title: `Date Changed: ${event?.title}`,
          body: `The date of ${event?.title} has changed to ${datetime ? new Date(datetime).toLocaleString() : 'a new time'}.`,
        };
      case 'DATE_CHOSEN':
        return {
          title: `Date Set: ${event?.title}`,
          body: `${event?.title} will be held on ${datetime ? new Date(datetime).toLocaleString() : 'the chosen date'}.`,
        };
      case 'DATE_RESET':
        return {
          title: `New Poll: ${event?.title}`,
          body: `A new poll has started for the date of ${event?.title}.`,
        };
      case 'NEW_POST':
        return {
          title: `New Post: ${post?.title}`,
          body: `${authorName} created a new post in ${event?.title}.`,
        };
      case 'NEW_REPLY':
        return {
          title: `New Reply: ${post?.title}`,
          body: `${authorName} replied to a post in ${event?.title}.`,
        };
      case 'USER_JOINED':
        return {
          title: `User Joined: ${event?.title}`,
          body: `${authorName} has joined ${event?.title}.`,
        };
      case 'USER_LEFT':
        return {
          title: `User Left: ${event?.title}`,
          body: `${authorName} has left ${event?.title}.`,
        };
      case 'USER_PROMOTED':
        return {
          title: `Promoted: ${event?.title}`,
          body: `You are now a Moderator of ${event?.title}.`,
        };
      case 'USER_DEMOTED':
        return {
          title: `Role Changed: ${event?.title}`,
          body: `You are no longer a Moderator of ${event?.title}.`,
        };
      case 'USER_RSVP':
        return {
          title: `New RSVP: ${event?.title}`,
          body: `${authorName} has RSVP'd ${rsvp || 'to'} ${event?.title}.`,
        };
      default:
        return {
          title: 'Groupi Notification',
          body: 'You have a new notification from Groupi.',
        };
    }
  };

  const { title, body } = getNotificationTitleAndBody();

  return {
    title,
    body,
    data: {
      notificationId: notification.id,
      type: notification.type,
      eventId: event?.id,
      postId: post?.id,
      url: getNotificationLink(),
    },
    url: getNotificationLink(),
    tag: `groupi-${notification.type}-${event?.id || post?.id}`,
  };
};

// ============================================================================
// ADDITIONAL EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to mark notification as unread
export const markNotificationAsUnreadEffect = (
  notificationId: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Update notification as unread (database operation with retry)
      const notification = yield* _(
        dbOperation(
          () =>
            db.notification.update({
              where: {
                id: notificationId,
                personId: userId,
              },
              data: {
                read: false,
              },
              include: {
                person: true,
                event: true,
                post: true,
                author: true,
              },
            }),
          _error => new NotificationUpdateError(_error),
          `Mark notification as unread: ${notificationId}`
        )
      );

      if (!notification) {
        return yield* _(
          Effect.fail(new NotificationNotFoundError(notificationId))
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for unread update: ${notificationId}`
        )
      );

      return notification;
    }),
    'notification',
    'markNotificationAsUnread',
    notificationId
  );

// Modernized Effect-based function to mark event notifications as read
export const markEventNotifsAsReadEffect = (eventId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Update event notifications as read (database operation with retry)
      const result = yield* _(
        dbOperation(
          () =>
            db.notification.updateMany({
              where: {
                eventId,
                personId: userId,
              },
              data: {
                read: true,
              },
            }),
          _error => new NotificationUpdateError(_error),
          `Mark event notifications as read: ${eventId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for event notifications read: ${eventId}`
        )
      );

      return result.count;
    }),
    'notification',
    'markEventNotifsAsRead',
    eventId
  );

// Modernized Effect-based function to mark post notifications as read
export const markPostNotifsAsReadEffect = (postId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Update post notifications as read (database operation with retry)
      const result = yield* _(
        dbOperation(
          () =>
            db.notification.updateMany({
              where: {
                postId,
                personId: userId,
              },
              data: {
                read: true,
              },
            }),
          _error => new NotificationUpdateError(_error),
          `Mark post notifications as read: ${postId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for post notifications read: ${postId}`
        )
      );

      return result.count;
    }),
    'notification',
    'markPostNotifsAsRead',
    postId
  );

// Modernized Effect-based function to delete a notification
export const deleteNotificationEffect = (
  notificationId: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Delete notification (database operation with retry)
      const notification = yield* _(
        dbOperation(
          () =>
            db.notification.delete({
              where: {
                id: notificationId,
                personId: userId,
              },
            }),
          _error => new NotificationDeletionError(_error),
          `Delete notification: ${notificationId}`
        )
      );

      if (!notification) {
        return yield* _(
          Effect.fail(new NotificationNotFoundError(notificationId))
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for notification deletion: ${notificationId}`
        )
      );

      return notification;
    }),
    'notification',
    'deleteNotification',
    notificationId
  );

// Modernized Effect-based function to delete all notifications for a user
export const deleteAllNotificationsEffect = (userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Delete all notifications (database operation with retry)
      const result = yield* _(
        dbOperation(
          () =>
            db.notification.deleteMany({
              where: {
                personId: userId,
              },
            }),
          _error => new NotificationDeletionError(_error),
          `Delete all notifications for user: ${userId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const personQueryDefinition = getNotificationQuery(userId);
            return getPusherServer().trigger(
              personQueryDefinition.pusherChannel,
              personQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for all notifications deletion: ${userId}`
        )
      );

      return result.count;
    }),
    'notification',
    'deleteAllNotifications',
    userId
  );

// Modernized Effect-based function to create event modification notifications
export const createEventModNotifsEffect = (
  eventId: string,
  type: Exclude<NotificationType, 'NEW_REPLY'>,
  userId: string,
  rsvp?: $Enums.Status
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: { memberships: true },
            }),
          _error => new Error('Failed to fetch event'),
          `Fetch event for modification notifications: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new Error('Event not found')));
      }

      // Check if user is in the event (business logic - no retry)
      const membership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!membership) {
        return yield* _(Effect.fail(new Error('User not in event')));
      }

      const personIds = event.memberships
        .filter(membership => membership.personId !== userId)
        .map(membership => membership.personId);

      // Create notifications efficiently with createMany (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.notification.createMany({
              data: personIds.map(personId => ({
                personId,
                eventId,
                type: type,
                authorId: userId,
                rsvp,
              })),
            }),
          _error => new NotificationCreationError(_error),
          `Create event modification notifications for: ${eventId}`
        )
      );

      // Fetch the created notifications with full details for external notifications
      const createdNotifications = yield* _(
        dbOperation(
          () =>
            db.notification.findMany({
              where: {
                personId: { in: personIds },
                eventId,
                type,
                authorId: userId,
                createdAt: { gte: new Date(Date.now() - 1000) }, // Created within last second
              },
              include: {
                person: true,
                event: true,
                post: true,
                author: true,
              },
            }),
          _error => new Error('Failed to fetch created notifications'),
          `Fetch created notifications for external processing: ${eventId}`
        )
      );

      // Send external notifications for each created notification
      for (const notification of createdNotifications) {
        yield* _(
          externalServiceOperation(
            async () => {
              const result = await sendExternalNotificationsEffect(
                notification
              ).pipe(Effect.runPromise);
              return result;
            },
            _error => new Error('Failed to send external notifications'),
            `Send external notifications for notification: ${notification.id}`
          )
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      const events: BatchEvent[] = [];
      for (const personId of personIds) {
        const notificationQueryDefinition = getNotificationQuery(personId);
        events.push({
          channel: notificationQueryDefinition.pusherChannel,
          name: notificationQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        });
      }

      if (events.length > 0) {
        yield* _(
          externalServiceOperation(
            () => getPusherServer().triggerBatch(events),
            _error => new Error('Failed to send pusher notifications'),
            `Send pusher notifications for event modification: ${eventId}`
          )
        );
      }

      return createdNotifications.length;
    }),
    'notification',
    'createEventModNotifs',
    eventId
  );

// Modernized Effect-based function to create post notifications
export const createPostNotifsEffect = (
  postId: string,
  type: 'NEW_REPLY',
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch post with event memberships (database operation with retry)
      const post = yield* _(
        dbOperation(
          () =>
            db.post.findUnique({
              where: { id: postId },
              include: {
                event: {
                  include: { memberships: true },
                },
              },
            }),
          _error => new Error('Failed to fetch post'),
          `Fetch post for notifications: ${postId}`
        )
      );

      if (!post) {
        return yield* _(Effect.fail(new Error('Post not found')));
      }

      // Check if user is in the event (business logic - no retry)
      const membership = post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!membership) {
        return yield* _(Effect.fail(new Error('User not in event')));
      }

      const personIds = post.event.memberships
        .filter(membership => membership.personId !== userId)
        .map(membership => membership.personId);

      // Create notifications efficiently with createMany (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.notification.createMany({
              data: personIds.map(personId => ({
                personId,
                postId,
                eventId: post.eventId,
                type: type,
                authorId: userId,
              })),
            }),
          _error => new NotificationCreationError(_error),
          `Create post notifications for: ${postId}`
        )
      );

      // Fetch the created notifications with full details for external notifications
      const createdNotifications = yield* _(
        dbOperation(
          () =>
            db.notification.findMany({
              where: {
                personId: { in: personIds },
                postId,
                type,
                authorId: userId,
                createdAt: { gte: new Date(Date.now() - 1000) }, // Created within last second
              },
              include: {
                person: true,
                event: true,
                post: true,
                author: true,
              },
            }),
          _error => new Error('Failed to fetch created notifications'),
          `Fetch created notifications for external processing: ${postId}`
        )
      );

      // Send external notifications for each created notification
      for (const notification of createdNotifications) {
        yield* _(
          externalServiceOperation(
            async () => {
              const result = await sendExternalNotificationsEffect(
                notification
              ).pipe(Effect.runPromise);
              return result;
            },
            _error => new Error('Failed to send external notifications'),
            `Send external notifications for notification: ${notification.id}`
          )
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      const events: BatchEvent[] = [];
      for (const personId of personIds) {
        const notificationQueryDefinition = getNotificationQuery(personId);
        events.push({
          channel: notificationQueryDefinition.pusherChannel,
          name: notificationQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        });
      }

      if (events.length > 0) {
        yield* _(
          externalServiceOperation(
            () => getPusherServer().triggerBatch(events),
            _error => new Error('Failed to send pusher notifications'),
            `Send pusher notifications for post notifications: ${postId}`
          )
        );
      }

      return createdNotifications.length;
    }),
    'notification',
    'createPostNotifs',
    postId
  );

// ============================================================================
// ADDITIONAL SAFE WRAPPER FUNCTIONS
// ============================================================================

export const markNotificationAsUnread = safeWrapper<
  [string, string],
  NotificationWithPersonEventPost,
  NotificationNotFoundError | NotificationUpdateError
>(
  async (notificationId: string, userId: string) => {
    const result = await Effect.runPromise(
      markNotificationAsUnreadEffect(notificationId, userId)
    );

    // Send real-time invalidation (fire-and-forget)
    import('./realtime-invalidation')
      .then(({ invalidateNotificationQueries }) => {
        invalidateNotificationQueries([userId], 'notification.read', {
          notificationId,
          userId,
          action: 'unread',
        });
      })
      .catch(() => {
        // Silently handle invalidation errors
      });

    return result;
  },
  z.any() // TODO: Create proper schema for NotificationWithPersonEventPost
);

export const markEventNotifsAsRead = safeWrapper<
  [string, string],
  z.infer<typeof NotificationCountSchema>,
  NotificationUpdateError
>(async (eventId: string, userId: string) => {
  const count = await Effect.runPromise(
    markEventNotifsAsReadEffect(eventId, userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateNotificationQueries }) => {
      invalidateNotificationQueries([userId], 'notification.read', {
        eventId,
        userId,
        action: 'mark_event_read',
        count,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return { count };
}, NotificationCountSchema);

export const markPostNotifsAsRead = safeWrapper<
  [string, string],
  z.infer<typeof NotificationCountSchema>,
  NotificationUpdateError
>(async (postId: string, userId: string) => {
  const count = await Effect.runPromise(
    markPostNotifsAsReadEffect(postId, userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateNotificationQueries }) => {
      invalidateNotificationQueries([userId], 'notification.read', {
        postId,
        userId,
        action: 'mark_post_read',
        count,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return { count };
}, NotificationCountSchema);

export const deleteNotification = safeWrapper(
  async (notificationId: string, userId: string) => {
    const result = await Effect.runPromise(
      deleteNotificationEffect(notificationId, userId)
    );

    // Send real-time invalidation (fire-and-forget)
    import('./realtime-invalidation')
      .then(({ invalidateNotificationQueries }) => {
        invalidateNotificationQueries([userId], 'notification.deleted', {
          notificationId,
          userId,
          action: 'deleted',
        });
      })
      .catch(() => {
        // Silently handle invalidation errors
      });

    return result;
  },
  z.any() // TODO: Replace with a proper schema for NotificationWithPersonEventPost
);

export const deleteAllNotifications = safeWrapper<
  [string],
  z.infer<typeof NotificationCountSchema>,
  NotificationDeletionError
>(async (userId: string) => {
  const count = await Effect.runPromise(deleteAllNotificationsEffect(userId));

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateNotificationQueries }) => {
      invalidateNotificationQueries([userId], 'notification.deleted', {
        userId,
        action: 'delete_all',
        count,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return { count };
}, NotificationCountSchema);

export const createEventModNotifs = safeWrapper<
  [string, Exclude<NotificationType, 'NEW_REPLY'>, string, $Enums.Status?],
  z.infer<typeof NotificationCountSchema>,
  NotificationCreationError
>(
  async (
    eventId: string,
    type: Exclude<NotificationType, 'NEW_REPLY'>,
    userId: string,
    rsvp?: $Enums.Status
  ) => {
    const count = await Effect.runPromise(
      createEventModNotifsEffect(eventId, type, userId, rsvp)
    );
    return { count };
  },
  NotificationCountSchema
);

export const createPostNotifs = safeWrapper<
  [string, 'NEW_REPLY', string],
  z.infer<typeof NotificationCountSchema>,
  NotificationCreationError
>(async (postId: string, type: 'NEW_REPLY', userId: string) => {
  const count = await Effect.runPromise(
    createPostNotifsEffect(postId, type, userId)
  );
  return { count };
}, NotificationCountSchema);

'use server';

import { ActionResponse, NotificationWithPersonEventPost } from '@/types';
import { auth } from '@clerk/nextjs/server';
import {
  $Enums,
  Membership,
  Notification,
  NotificationType,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { BatchEvent } from 'pusher';
import { db } from '../db';
import { pusherServer } from '../pusher-server';
import { getNotificationQuery } from '../query-definitions';
import { resend } from '../email';
import { NotificationEmailTemplate } from '@/components/email-template';
import { CreateEmailResponseSuccess } from 'resend';
import { notificationLogger, emailLogger } from '@/lib/logger';

export const fetchNotificationsForPerson = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost[]>> => {
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return {
      error: 'User not found',
    };
  }

  if (userId !== id) {
    return {
      error: "You are not authorized to view this user's notifications",
    };
  }

  const person = await db.person.findUnique({
    where: {
      id,
    },
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
  });

  if (!person) {
    return {
      error: 'Person not found',
    };
  }

  return {
    success: person.notifications,
  };
};

export const markNotificationAsRead = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notification = await db.notification.update({
      where: {
        id,
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
    });

    if (!notification) {
      return {
        error: 'Notification not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notification,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const markAllNotificationsAsRead = async (): Promise<
  ActionResponse<number>
> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notifications = await db.notification.updateMany({
      where: {
        personId: userId,
      },
      data: {
        read: true,
      },
    });

    if (!notifications) {
      return {
        error: 'Notifications not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const markNotificationAsUnread = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notification = await db.notification.update({
      where: {
        id,
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
    });

    if (!notification) {
      return {
        error: 'Notification not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notification,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const markEventNotifsAsRead = async (
  eventId: string
): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notifications = await db.notification.updateMany({
      where: {
        personId: userId,
        eventId,
        type: {
          in: [
            NotificationType.EVENT_EDITED,
            NotificationType.DATE_CHANGED,
            NotificationType.DATE_CHOSEN,
            NotificationType.DATE_RESET,
            NotificationType.USER_JOINED,
            NotificationType.USER_LEFT,
            NotificationType.USER_PROMOTED,
            NotificationType.USER_DEMOTED,
            NotificationType.USER_RSVP,
          ],
        },
      },
      data: {
        read: true,
      },
    });

    if (!notifications) {
      return {
        error: 'Notifications not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const markPostNotifsAsRead = async (
  postId: string
): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notifications = await db.notification.updateMany({
      where: {
        personId: userId,
        postId,
        type: {
          in: [NotificationType.NEW_POST, NotificationType.NEW_REPLY],
        },
      },
      data: {
        read: true,
      },
    });

    if (!notifications) {
      return {
        error: 'Notifications not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const deleteNotification = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notification = await db.notification.delete({
      where: {
        id,
        personId: userId,
      },
      include: {
        person: true,
        event: true,
        post: true,
        author: true,
      },
    });

    if (!notification) {
      return {
        error: 'Notification not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notification,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const deleteAllNotifications = async (): Promise<
  ActionResponse<number>
> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const notifications = await db.notification.deleteMany({
      where: {
        personId: userId,
      },
    });

    if (!notifications) {
      return {
        error: 'Notifications not found',
      };
    }

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(userId);

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Event data updated',
      }
    );

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'author'>
): Promise<ActionResponse<Notification>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    let membership: Membership | undefined = undefined;

    if (notification.eventId) {
      const event = await db.event.findUnique({
        where: {
          id: notification.eventId,
        },
        include: {
          memberships: true,
        },
      });
      if (!event) {
        return {
          error: 'Event not found',
        };
      }

      membership = event.memberships.find(
        membership => membership.personId === userId
      );
    } else if (notification.postId) {
      const post = await db.post.findUnique({
        where: {
          id: notification.postId,
        },
        include: {
          event: {
            include: {
              memberships: true,
            },
          },
        },
      });

      if (!post) {
        return {
          error: 'Post not found',
        };
      }

      membership = post.event.memberships.find(
        membership => membership.personId === userId
      );
    }

    if (!membership) {
      return {
        error: 'User not in event',
      };
    }

    const newNotification = await db.notification.create({
      data: {
        ...notification,
        authorId: userId,
      },
    });

    revalidatePath('/');

    const personQueryDefinition = getNotificationQuery(
      newNotification.personId
    );

    pusherServer.trigger(
      personQueryDefinition.pusherChannel,
      personQueryDefinition.pusherEvent,
      {
        message: 'Data updated',
      }
    );

    return { success: newNotification };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const createEventNotifs = async ({
  eventId,
  type,
  postId,
  datetime,
}: {
  eventId: string;
  type: Exclude<NotificationType, 'NEW_REPLY'>;
  postId?: string;
  datetime?: Date;
}): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        memberships: true,
      },
    });

    if (!event) {
      return {
        error: 'Event not found',
      };
    }

    // make sure user is in the event
    const membership = event.memberships.find(
      membership => membership.personId === userId
    );

    if (!membership) {
      return {
        error: 'User not in event',
      };
    }

    const personIds = event.memberships
      .filter(membership => membership.personId !== userId)
      .map(membership => membership.personId);

    const notifications = await db.notification.createMany({
      data: personIds.map(personId => ({
        personId,
        eventId,
        postId,
        type: type,
        authorId: userId,
        datetime,
      })),
    });

    revalidatePath('/');

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
      await pusherServer.triggerBatch(events);
    } else {
      notificationLogger.debug('No events to send for notification update');
    }

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const createEventModNotifs = async ({
  eventId,
  type,
  rsvp,
}: {
  eventId: string;
  type: Exclude<NotificationType, 'NEW_REPLY'>;
  rsvp?: $Enums.Status;
}): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        memberships: true,
      },
    });

    if (!event) {
      return {
        error: 'Event not found',
      };
    }

    // make sure user is in the event
    const membership = event.memberships.find(
      membership => membership.personId === userId
    );

    if (!membership) {
      return {
        error: 'User not in event',
      };
    }

    const personIds = event.memberships
      .filter(
        membership =>
          membership.personId !== userId && membership.role !== 'ATTENDEE'
      )
      .map(membership => membership.personId);

    const notifications = await db.notification.createMany({
      data: personIds.map(personId => ({
        personId,
        eventId,
        type: type,
        authorId: userId,
        rsvp,
      })),
    });

    revalidatePath('/');

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
      await pusherServer.triggerBatch(events);
    } else {
      notificationLogger.debug(
        'No events to send for event modification notification'
      );
    }

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const createPostNotifs = async ({
  postId,
  type,
}: {
  postId: string;
  type: 'NEW_REPLY';
}): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        replies: true,
        event: {
          include: {
            memberships: true,
          },
        },
      },
    });

    if (!post) {
      return {
        error: 'Post not found',
      };
    }

    // make sure user is in the event
    const membership = post.event.memberships.find(
      membership => membership.personId === userId
    );

    if (!membership) {
      return {
        error: 'User not in event',
      };
    }

    const personIds = Array.from(
      new Set([...post.replies.map(reply => reply.authorId), post.authorId])
    ).filter(personId => personId !== userId);

    const notifications = await db.notification.createMany({
      data: personIds.map(personId => ({
        personId,
        postId,
        type: type,
        authorId: userId,
        eventId: post.eventId,
      })),
    });

    revalidatePath('/');

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
      await pusherServer.triggerBatch(events);
    } else {
      notificationLogger.debug('No events to send for post notification');
    }

    return {
      success: notifications.count,
    };
  } catch (_e) {
    return {
      error: 'Notification not found',
    };
  }
};

export const sendExternalNotifications = async (
  notification: NotificationWithPersonEventPost
): Promise<ActionResponse<string>> => {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      return {
        error: 'User not found',
      };
    }

    // Route given notification to given services based on user's notification settings
    const person = await db.person.findUnique({
      where: {
        id: userId,
      },
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
    });
    if (!person) {
      return {
        error: 'Person not found',
      };
    }
    if (!person.settings) {
      return {
        error: 'Settings not found',
      };
    }

    const methods = person.settings.notificationMethods.filter(method =>
      method.notifications.some(
        notif => notif.notificationType === notification.type && notif.enabled
      )
    );

    // Handle each method
    for (const method of methods) {
      switch (method.type) {
        case 'EMAIL': {
          emailLogger.info('Sending email notification', {
            recipientEmail: method.value,
            notificationId: notification.id,
            notificationType: notification.type,
          });
          const res = await sendEmailNotification({ notification });
          if (res.error) {
            emailLogger.error('Failed to send email notification', {
              error: res.error,
              recipientEmail: method.value,
              notificationId: notification.id,
            });
          } else {
            emailLogger.info('Email notification sent successfully', {
              result: res.success,
              recipientEmail: method.value,
              notificationId: notification.id,
            });
          }
          break;
        }
        case 'PUSH': {
          // Send push notification
          // Implement push notification logic here
          notificationLogger.info('Sending push notification', {
            recipientToken: method.value,
            notificationId: notification.id,
            notificationType: notification.type,
          });
          break;
        }
        case 'WEBHOOK': {
          // Send webhook notification
          notificationLogger.info('Sending webhook notification', {
            webhookUrl: method.value,
            notificationId: notification.id,
            notificationType: notification.type,
          });
          break;
        }
        default:
          notificationLogger.warn('Unknown notification method', {
            methodType: method.type,
            notificationId: notification.id,
          });
      }
    }

    return {
      success: 'Notifications sent successfully',
    };
  } catch (_e) {
    return {
      error: 'Notification could not be sent',
    };
  }
};

const sendEmailNotification = async ({
  notification,
}: {
  notification: NotificationWithPersonEventPost;
}): Promise<ActionResponse<CreateEmailResponseSuccess>> => {
  try {
    // turn notification details into email title and content
    if (!notification) {
      return {
        error: 'Notification details are required',
      };
    }

    const { data, error } = await resend.emails.send({
      from: '<your-email@example.com>',
      to: '<recipient-email@example.com>',
      subject: 'Notification',
      react: NotificationEmailTemplate({ notification }),
    });

    if (error) {
      return {
        error: 'Failed to send email',
      };
    }
    if (!data) {
      return {
        error: 'No data returned from email service',
      };
    }
    return {
      success: data,
    };
  } catch (error) {
    emailLogger.error('Failed to send email notification', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return {
      error: 'Email sending failed',
    };
  }
};

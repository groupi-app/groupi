import PushNotifications from '@pusher/push-notifications-server';
import {
  getNEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID,
  getPUSHER_BEAMS_SECRET_KEY,
  getNEXT_PUBLIC_BASE_URL,
} from './env';
import { notificationLogger } from './logger';

// Initialize Pusher Beams server client
const beamsClient = new PushNotifications({
  instanceId: getNEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID(),
  secretKey: getPUSHER_BEAMS_SECRET_KEY(),
});

export interface PusherBeamsNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

/**
 * Send a push notification to a specific authenticated user via Pusher Beams
 */
export async function sendPusherBeamsNotification(
  userId: string,
  notification: PusherBeamsNotification
): Promise<{ success?: string; error?: string }> {
  try {
    notificationLogger.info(
      {
        userId,
        title: notification.title,
        body: notification.body,
        hasData: !!notification.data,
        hasUrl: !!notification.url,
        tag: notification.tag,
      },
      'Sending Pusher Beams notification to user'
    );

    const publishRequest = {
      users: [userId],
      web: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: getNEXT_PUBLIC_BASE_URL() + '/icon-192x192.png',
          badge: getNEXT_PUBLIC_BASE_URL() + '/icon-192x192.png',
          data: notification.data || {},
          tag: notification.tag,
          actions: notification.url
            ? [
                {
                  action: 'view',
                  title: 'View',
                  icon: '/favicon.ico',
                },
              ]
            : undefined,
        },
        data: {
          ...notification.data,
          url: notification.url,
        },
      },
    };

    const publishResponse = await beamsClient.publishToUsers(
      [userId],
      publishRequest
    );

    notificationLogger.info(
      {
        userId,
        publishResponse,
        title: notification.title,
      },
      'Pusher Beams notification sent successfully'
    );

    return { success: 'Pusher Beams notification sent successfully' };
  } catch (error) {
    notificationLogger.error(
      {
        userId,
        title: notification.title,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to send Pusher Beams notification'
    );

    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notifications to multiple users via Pusher Beams
 */
export async function sendPusherBeamsNotificationToUsers(
  userIds: string[],
  notification: PusherBeamsNotification
): Promise<{ success?: string; error?: string }> {
  try {
    if (userIds.length === 0) {
      return { success: 'No users to notify' };
    }

    notificationLogger.info(
      {
        userIds,
        userCount: userIds.length,
        title: notification.title,
        body: notification.body,
      },
      'Sending Pusher Beams notification to multiple users'
    );

    const publishRequest = {
      users: userIds,
      web: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/favicon.ico',
          badge: notification.badge || '/favicon.ico',
          data: notification.data || {},
          tag: notification.tag,
          actions: notification.url
            ? [
                {
                  action: 'view',
                  title: 'View',
                  icon: '/favicon.ico',
                },
              ]
            : undefined,
        },
        data: {
          ...notification.data,
          url: notification.url,
        },
      },
    };

    const publishResponse = await beamsClient.publishToUsers(
      userIds,
      publishRequest
    );

    notificationLogger.info(
      {
        userIds,
        userCount: userIds.length,
        publishResponse,
        title: notification.title,
      },
      'Pusher Beams notification sent to multiple users successfully'
    );

    return {
      success: `Pusher Beams notification sent to ${userIds.length} users successfully`,
    };
  } catch (error) {
    notificationLogger.error(
      {
        userIds,
        userCount: userIds.length,
        title: notification.title,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to send Pusher Beams notification to multiple users'
    );

    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { beamsClient };

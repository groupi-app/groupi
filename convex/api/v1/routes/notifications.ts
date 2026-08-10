import {
  OpenAPIHono,
  createRoute,
  z,
  extendZodWithOpenApi,
} from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema, MessageResponseSchema } from '../schemas/common';
import {
  NotificationIdParamSchema,
  NotificationListResponseSchema,
  UnreadCountResponseSchema,
} from '../schemas/notifications';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createNotificationRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /notifications - List notifications
  const listNotificationsRoute = createRoute({
    method: 'get',
    path: '/notifications',
    tags: ['Notifications'],
    summary: 'List notifications',
    description:
      'Get all notifications for the authenticated user. Optionally filter to unread only.',
    security: [{ apiKey: [] }],
    request: {
      query: z.object({
        unread: z.string().optional().openapi({
          example: 'true',
          description: 'Filter to unread notifications only',
        }),
      }),
    },
    responses: {
      200: {
        description: 'List of notifications',
        content: {
          'application/json': {
            schema: NotificationListResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listNotificationsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { unread } = c.req.valid('query');

    const unreadOnly = unread === 'true';

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.notifications.listNotifications;
    const result = await ctx.runQuery(listFn, { personId, unreadOnly });

    return c.json(result, 200);
  });

  // GET /notifications/count - Get unread count
  const unreadCountRoute = createRoute({
    method: 'get',
    path: '/notifications/count',
    tags: ['Notifications'],
    summary: 'Get unread count',
    description: 'Get the number of unread notifications',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'Unread notification count',
        content: {
          'application/json': {
            schema: UnreadCountResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(unreadCountRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const countFn = internal.api.v1.internal.notifications.getUnreadCount;
    const result = await ctx.runQuery(countFn, { personId });

    return c.json({ count: result.count }, 200);
  });

  // POST /notifications/:notificationId/read - Mark as read
  const markAsReadRoute = createRoute({
    method: 'post',
    path: '/notifications/{notificationId}/read',
    tags: ['Notifications'],
    summary: 'Mark notification as read',
    description: 'Mark a single notification as read',
    security: [{ apiKey: [] }],
    request: {
      params: NotificationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Notification marked as read',
        content: {
          'application/json': {
            schema: MessageResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Notification not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(markAsReadRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { notificationId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const readFn = internal.api.v1.internal.notifications.markAsRead;
      await ctx.runMutation(readFn, { notificationId, personId });

      return c.json({ message: 'Notification marked as read' }, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Notification not found';
      return c.json({ error: { code: 'NOT_FOUND', message } }, 404);
    }
  });

  // POST /notifications/:notificationId/unread - Mark as unread
  const markAsUnreadRoute = createRoute({
    method: 'post',
    path: '/notifications/{notificationId}/unread',
    tags: ['Notifications'],
    summary: 'Mark notification as unread',
    description: 'Mark a single notification as unread',
    security: [{ apiKey: [] }],
    request: {
      params: NotificationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Notification marked as unread',
        content: {
          'application/json': {
            schema: MessageResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Notification not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(markAsUnreadRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { notificationId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const unreadFn = internal.api.v1.internal.notifications.markAsUnread;
      await ctx.runMutation(unreadFn, { notificationId, personId });

      return c.json({ message: 'Notification marked as unread' }, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Notification not found';
      return c.json({ error: { code: 'NOT_FOUND', message } }, 404);
    }
  });

  // POST /notifications/read-all - Mark all as read
  const markAllAsReadRoute = createRoute({
    method: 'post',
    path: '/notifications/read-all',
    tags: ['Notifications'],
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for the authenticated user',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'All notifications marked as read',
        content: {
          'application/json': {
            schema: MessageResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(markAllAsReadRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const markAllFn = internal.api.v1.internal.notifications.markAllAsRead;
    const result = await ctx.runMutation(markAllFn, { personId });

    return c.json(
      { message: `Marked ${result.count} notifications as read` },
      200
    );
  });

  // DELETE /notifications/:notificationId - Delete notification
  const deleteNotificationRoute = createRoute({
    method: 'delete',
    path: '/notifications/{notificationId}',
    tags: ['Notifications'],
    summary: 'Delete notification',
    description: 'Delete a single notification',
    security: [{ apiKey: [] }],
    request: {
      params: NotificationIdParamSchema,
    },
    responses: {
      204: {
        description: 'Notification deleted',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Notification not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteNotificationRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { notificationId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      // prettier-ignore
      const deleteFn = internal.api.v1.internal.notifications.deleteNotification;
      await ctx.runMutation(deleteFn, { notificationId, personId });

      return c.body(null, 204);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Notification not found';
      return c.json({ error: { code: 'NOT_FOUND', message } }, 404);
    }
  });

  // DELETE /notifications - Delete all notifications
  const deleteAllNotificationsRoute = createRoute({
    method: 'delete',
    path: '/notifications',
    tags: ['Notifications'],
    summary: 'Delete all notifications',
    description: 'Delete all notifications for the authenticated user',
    security: [{ apiKey: [] }],
    responses: {
      204: {
        description: 'All notifications deleted',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteAllNotificationsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    // prettier-ignore
    const deleteAllFn = internal.api.v1.internal.notifications.deleteAllNotifications;
    await ctx.runMutation(deleteAllFn, { personId });

    return c.body(null, 204);
  });

  return app;
}

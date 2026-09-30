import {
  OpenAPIHono,
  createRoute,
  z,
  extendZodWithOpenApi,
} from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
extendZodWithOpenApi(z);
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema, MessageResponseSchema } from '../schemas/common';
import {
  NotificationIdParamSchema,
  NotificationSchema,
  NotificationListResponseSchema,
  UnreadCountResponseSchema,
} from '../schemas/notifications';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createNotificationRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });

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
      query: z
        .object({
          unread: z.enum(['true', 'false']).optional(),
          pagination: z.literal('cursor').optional(),
          limit: z
            .string()
            .regex(/^[1-9]\d*$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(100))
            .optional(),
          cursor: z.string().min(1).max(8192).optional(),
        })
        .refine(
          q =>
            q.pagination === 'cursor' ||
            (q.limit === undefined && q.cursor === undefined),
          'Set pagination=cursor when using limit or cursor'
        ),
    },
    responses: {
      200: {
        description: 'List of notifications',
        content: {
          'application/json': {
            schema: z.union([
              NotificationListResponseSchema,
              z.object({
                items: z.array(NotificationSchema),
                nextCursor: z.string().nullable(),
              }),
            ]),
          },
        },
      },
      400: {
        description: 'Invalid pagination',
        content: { 'application/json': { schema: ErrorResponseSchema } },
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
    const { unread, pagination, limit, cursor } = c.req.valid('query');
    if (pagination === 'cursor') {
      const result = await ctx.runQuery(
        internal.api.v1.internal.notifications.listNotificationsPage,
        {
          personId:
            personId as import('../../../_generated/dataModel').Id<'persons'>,
          unreadOnly: unread === 'true',
          limit: limit ?? 20,
          cursor: cursor ?? null,
        }
      );
      if ('error' in result)
        return c.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid notification cursor. Restart without a cursor.',
            },
          },
          400
        );
      return c.json(result, 200);
    }

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

  for (const scope of ['events', 'posts'] as const) {
    const route = createRoute({
      method: 'post',
      path: `/notifications/${scope}/{scopeId}/read`,
      tags: ['Notifications'],
      summary: `Mark ${scope} notifications read`,
      security: [{ apiKey: [] }],
      request: { params: z.object({ scopeId: z.string() }) },
      responses: {
        200: {
          description: 'Notifications marked read',
          content: {
            'application/json': {
              schema: z.object({ success: z.boolean(), count: z.number() }),
            },
          },
        },
        400: {
          description: 'Invalid scope',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    });
    app.openapi(route, async c => {
      const ctx = c.get('ctx');
      try {
        const result = await ctx.runMutation(
          internal.api.v1.internal.notifications.markScopeAsRead,
          {
            personId: c.get(
              'personId'
            ) as import('../../../_generated/dataModel').Id<'persons'>,
            ...(scope === 'events'
              ? {
                  eventId: c.req.valid('param')
                    .scopeId as import('../../../_generated/dataModel').Id<'events'>,
                }
              : {
                  postId: c.req.valid('param')
                    .scopeId as import('../../../_generated/dataModel').Id<'posts'>,
                }),
          }
        );
        return c.json(result, 200);
      } catch {
        return c.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid notification scope',
            },
          },
          400
        );
      }
    });
  }
  return app;
}

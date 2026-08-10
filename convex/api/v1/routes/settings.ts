import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema } from '../schemas/common';
import {
  PrivacySettingsSchema,
  UpdatePrivacySettingsRequestSchema,
  NotificationSettingsSchema,
} from '../schemas/settings';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createSettingsRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /settings/privacy - Get privacy settings
  const getPrivacyRoute = createRoute({
    method: 'get',
    path: '/settings/privacy',
    tags: ['Settings'],
    summary: 'Get privacy settings',
    description: "Get the authenticated user's privacy settings",
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'Privacy settings',
        content: {
          'application/json': {
            schema: PrivacySettingsSchema,
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

  app.openapi(getPrivacyRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.settings.getPrivacySettings;
    const result = await ctx.runQuery(getFn, { personId });

    return c.json(result, 200);
  });

  // PUT /settings/privacy - Update privacy settings
  const updatePrivacyRoute = createRoute({
    method: 'put',
    path: '/settings/privacy',
    tags: ['Settings'],
    summary: 'Update privacy settings',
    description: "Update the authenticated user's privacy settings",
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdatePrivacySettingsRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated privacy settings',
        content: {
          'application/json': {
            schema: PrivacySettingsSchema,
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
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

  app.openapi(updatePrivacyRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateFn = internal.api.v1.internal.settings.updatePrivacySettings;
    const result = await ctx.runMutation(updateFn, { personId, ...body });

    return c.json(result, 200);
  });

  // GET /settings/notifications - Get notification settings
  const getNotificationsRoute = createRoute({
    method: 'get',
    path: '/settings/notifications',
    tags: ['Settings'],
    summary: 'Get notification settings',
    description:
      "Get the authenticated user's notification methods and type-level settings",
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'Notification settings',
        content: {
          'application/json': {
            schema: NotificationSettingsSchema,
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

  app.openapi(getNotificationsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.settings.getNotificationSettings;
    const result = await ctx.runQuery(getFn, { personId });

    return c.json(result, 200);
  });

  return app;
}

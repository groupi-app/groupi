import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { httpAction } from '../../_generated/server';
import { validateApiKey, getApiKey } from '../v1/middleware/auth';
import { createEventRoutes } from './routes/events';
import { createPostRoutes } from './routes/posts';
import { createReplyRoutes } from './routes/replies';
import { createMemberRoutes } from './routes/members';
import { createAvailabilityRoutes } from './routes/availability';
import { createFriendRoutes } from './routes/friends';
import { createAddonRoutes } from './routes/addons';
import { createNotificationRoutes } from './routes/notifications';
import { createMutingRoutes } from './routes/muting';
import { createProfileRoutes } from './routes/profile';
import { createSettingsRoutes } from './routes/settings';
import { createThemeRoutes } from './routes/themes';
import { createInviteRoutes } from './routes/invites';
import { createReportRoutes } from './routes/reports';
import { createAdminRoutes } from './routes/admin';

/**
 * REST API v2 Entry Point
 *
 * This module creates the OpenAPI-documented REST API using Hono.
 * All routes are authenticated via API key (x-api-key header).
 */

// Type for Hono app with Convex context
type Variables = {
  ctx: unknown;
  userId: string;
  personId: string;
};

/**
 * Create the API v2 Hono app
 */
export function createApiV2App(
  injectedCtx?: unknown,
  injectedUserId?: string,
  injectedPersonId?: string
) {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // Inject Convex context BEFORE routes are matched
  app.use('*', async (c, next) => {
    if (injectedCtx) c.set('ctx', injectedCtx as Variables['ctx']);
    if (injectedUserId) c.set('userId', injectedUserId);
    if (injectedPersonId) c.set('personId', injectedPersonId);
    await next();
  });

  // CORS middleware
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'x-api-key'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
    })
  );

  // Error handler
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json(
        {
          error: {
            code:
              err.status === 401
                ? 'UNAUTHORIZED'
                : err.status === 403
                  ? 'FORBIDDEN'
                  : 'ERROR',
            message: err.message,
          },
        },
        err.status
      );
    }
    console.error('Unhandled error:', err);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      500
    );
  });

  app.notFound(c =>
    c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      },
      404
    )
  );

  // OpenAPI documentation endpoint
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Groupi API',
      version: '2.0.0',
      description: `
Groupi REST API for event planning and coordination.

## Authentication

All API endpoints require authentication via API key. Include your API key in the \`x-api-key\` header:

\`\`\`
x-api-key: grp_your_api_key_here
\`\`\`

You can create and manage API keys in your Groupi settings.

## Rate Limiting

API requests are rate limited. If you exceed the limit, you'll receive a 429 Too Many Requests response.

## Errors

All errors return a consistent JSON format with an appropriate HTTP status code:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
\`\`\`
      `.trim(),
    },
    servers: [
      {
        url: '/api/v2',
        description: 'API v2',
      },
    ],
    tags: [
      { name: 'Events', description: 'Event management' },
      { name: 'Posts', description: 'Event posts and discussions' },
      { name: 'Replies', description: 'Post replies' },
      { name: 'Members', description: 'Event member management' },
      { name: 'Availability', description: 'Date availability voting' },
      { name: 'Friends', description: 'Friend management' },
      { name: 'Add-ons', description: 'Event add-on management' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Muting', description: 'Muting events and posts' },
      { name: 'Profile', description: 'User profiles' },
      { name: 'Settings', description: 'User settings' },
      { name: 'Themes', description: 'Custom themes' },
      { name: 'Invites', description: 'Event invitations' },
      { name: 'Reports', description: 'Content reporting' },
      { name: 'Admin', description: 'Administrative operations' },
    ],
  });

  // Swagger UI
  app.get('/docs', swaggerUI({ url: '/api/v2/openapi.json' }));

  // Health check (no auth required)
  app.get('/health', c => {
    return c.json({ status: 'ok', version: '2.0.0' });
  });

  // Mount route groups
  app.route('/', createEventRoutes());
  app.route('/', createPostRoutes());
  app.route('/', createReplyRoutes());
  app.route('/', createMemberRoutes());
  app.route('/', createAvailabilityRoutes());
  app.route('/', createFriendRoutes());
  app.route('/', createAddonRoutes());
  app.route('/', createNotificationRoutes());
  app.route('/', createMutingRoutes());
  app.route('/', createProfileRoutes());
  app.route('/', createSettingsRoutes());
  app.route('/', createThemeRoutes());
  app.route('/', createInviteRoutes());
  app.route('/', createReportRoutes());
  app.route('/', createAdminRoutes());

  // Register OpenAPI security scheme
  app.openAPIRegistry.registerComponent('securitySchemes', 'apiKey', {
    type: 'apiKey',
    name: 'x-api-key',
    in: 'header',
    description: 'API key for authentication',
  });

  return app;
}

/**
 * HTTP Action handler for the REST API
 *
 * This is the main entry point that Convex HTTP router uses.
 */
export const handler = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const strippedPath = url.pathname.replace(/^\/api\/v2/, '') || '/';

  const honoUrl = new URL(request.url);
  honoUrl.pathname = strippedPath;

  const publicPaths = ['/docs', '/openapi.json', '/health', '/'];
  const isPublicPath = publicPaths.some(
    p => strippedPath === p || strippedPath.startsWith('/docs')
  );

  if (!isPublicPath) {
    const apiKey = getApiKey(request.headers);
    try {
      const auth = await validateApiKey(ctx, apiKey);
      const app = createApiV2App(ctx, auth.userId, auth.personId);

      const modifiedRequest = new Request(honoUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : (request.body as unknown as RequestInit['body']),
      });

      return app.fetch(modifiedRequest);
    } catch (error) {
      if (error instanceof HTTPException) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'UNAUTHORIZED',
              message: error.message,
            },
          }),
          {
            status: error.status,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
  }

  const app = createApiV2App(ctx);
  const publicRequest = new Request(honoUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : (request.body as unknown as RequestInit['body']),
  });

  return app.fetch(publicRequest);
});

// API v2 reuses the existing v1 internal functions; only the HTTP contract is
// versioned.

import { ConvexError } from 'convex/values';
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { httpAction } from '../../_generated/server';
import { validateApiKey, getApiKey } from '../v1/middleware/auth';
import { createCliAuthRoutes } from './routes/cliAuth';
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
      allowHeaders: ['Content-Type', 'x-api-key', 'Idempotency-Key'],
      exposeHeaders: ['Content-Length', 'Retry-After'],
      maxAge: 86400,
    })
  );

  // Error handler
  app.onError((err, c) => {
    if (err instanceof ConvexError) {
      let data: unknown = err.data;
      // Convex serializes error data when crossing a function boundary.
      if (typeof data === 'string') {
        try {
          const decoded: unknown = JSON.parse(data);
          if (decoded && typeof decoded === 'object') data = decoded;
        } catch {
          /* Plain string validation message. */
        }
      }
      if (
        data &&
        typeof data === 'object' &&
        'code' in data &&
        typeof data.code === 'string' &&
        [
          'VALIDATION_ERROR',
          'FORBIDDEN',
          'IDEMPOTENCY_CONFLICT',
          'IDEMPOTENCY_EXPIRED',
          'DATE_RESET_REQUIRED',
          'NOT_FOUND',
          'INVITE_UNAVAILABLE',
        ].includes(data.code) &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        const { code, message } = data;
        const status =
          code === 'NOT_FOUND'
            ? 404
            : code === 'FORBIDDEN'
              ? 403
              : code === 'VALIDATION_ERROR'
                ? 400
                : 409;
        return c.json({ error: { code, message } }, status);
      }
    }
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

All resource endpoints require authentication via API key. The CLI exchange endpoint
uses a single-use browser authorization code and PKCE proof instead. Include your API key in the \`x-api-key\` header:

\`\`\`
x-api-key: grp_your_api_key_here
\`\`\`

You can create and manage API keys in your Groupi settings.

## API key scopes

Keys without stored permissions retain full access allowed by the account. A key
with permissions must explicitly grant the top-level REST collection (for example,
\`events\`) and action: \`read\` for GET/HEAD or \`write\` for other methods.
An \`events\` grant includes nested event routes. Grants never bypass membership,
role, or ownership checks. Unknown or malformed permission records fail closed;
there are no wildcard grants. Expired, revoked, disabled, or actively banned
accounts cannot authenticate.

## Rate Limiting

API-key usage quotas and configured rate limits are enforced across v1 and v2. Exceeding a limit returns 429; temporary rate limits include Retry-After in seconds.

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
    return c.json({
      status: 'ok',
      version: '2.0.0',
      capabilities: {
        eventWrites: { version: 1 },
        inviteWrites: { version: 1, retentionMs: 86400000 },
        eventCreationIdempotency: { version: 1, retentionMs: 86400000 },
      },
    });
  });

  app.route('/', createCliAuthRoutes());

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

  // Request supplies the Fetch init fields, including duplex for streamed bodies.
  // The cast bridges React Native's narrower ambient RequestInit body type.
  const publicPaths = ['/docs', '/openapi.json', '/health', '/'];
  const isPublicPath =
    (request.method === 'POST' && strippedPath === '/auth/cli/exchange') ||
    publicPaths.some(
      p => strippedPath === p || strippedPath.startsWith('/docs')
    );

  if (!isPublicPath) {
    const apiKey = getApiKey(request.headers);
    try {
      const auth = await validateApiKey(ctx, apiKey, request);
      const app = createApiV2App(ctx, auth.userId, auth.personId);

      const modifiedRequest = new Request(
        honoUrl.toString(),
        request as unknown as RequestInit
      );

      return app.fetch(modifiedRequest);
    } catch (error) {
      if (error instanceof HTTPException) {
        return new Response(
          JSON.stringify({
            error: {
              code:
                error.status === 403
                  ? 'FORBIDDEN'
                  : error.status === 429
                    ? 'RATE_LIMITED'
                    : 'UNAUTHORIZED',
              message: error.message,
            },
          }),
          {
            status: error.status,
            headers: {
              'Content-Type': 'application/json',
              ...(error.getResponse().headers.has('Retry-After')
                ? {
                    'Retry-After': error
                      .getResponse()
                      .headers.get('Retry-After')!,
                  }
                : {}),
            },
          }
        );
      }
      throw error;
    }
  }

  const app = createApiV2App(ctx);
  const publicRequest = new Request(
    honoUrl.toString(),
    request as unknown as RequestInit
  );

  return app.fetch(publicRequest);
});

// API v2 reuses the existing v1 internal functions; only the HTTP contract is
// versioned.

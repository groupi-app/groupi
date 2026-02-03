import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { httpAction } from '../../_generated/server';
import { validateApiKey, getApiKey } from './middleware/auth';
import { createEventRoutes } from './routes/events';
import { createPostRoutes } from './routes/posts';
import { createReplyRoutes } from './routes/replies';
import { createMemberRoutes } from './routes/members';
import { createAvailabilityRoutes } from './routes/availability';
import { createFriendRoutes } from './routes/friends';

/**
 * REST API v1 Entry Point
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
 * Create the API v1 Hono app
 */
function createApiV1App() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

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
          success: false,
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
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      500
    );
  });

  // OpenAPI documentation endpoint
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Groupi API',
      version: '1.0.0',
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

All errors return a consistent JSON format:

\`\`\`json
{
  "success": false,
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
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    tags: [
      { name: 'Events', description: 'Event management' },
      { name: 'Posts', description: 'Event posts and discussions' },
      { name: 'Replies', description: 'Post replies' },
      { name: 'Members', description: 'Event member management' },
      { name: 'Availability', description: 'Date availability voting' },
      { name: 'Friends', description: 'Friend management' },
    ],
  });

  // Swagger UI
  app.get('/docs', swaggerUI({ url: '/api/v1/openapi.json' }));

  // Health check (no auth required)
  app.get('/health', c => {
    return c.json({ status: 'ok', version: '1.0.0' });
  });

  // Mount route groups
  app.route('/', createEventRoutes());
  app.route('/', createPostRoutes());
  app.route('/', createReplyRoutes());
  app.route('/', createMemberRoutes());
  app.route('/', createAvailabilityRoutes());
  app.route('/', createFriendRoutes());

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
  const app = createApiV1App();

  // Get the path relative to /api/v1
  const url = new URL(request.url);
  const strippedPath = url.pathname.replace(/^\/api\/v1/, '') || '/';

  // Create a new URL with the stripped path for Hono to match routes
  const honoUrl = new URL(request.url);
  honoUrl.pathname = strippedPath;

  // Skip auth for docs and health endpoints
  const publicPaths = ['/docs', '/openapi.json', '/health', '/'];
  const isPublicPath = publicPaths.some(
    p => strippedPath === p || strippedPath.startsWith('/docs')
  );

  if (!isPublicPath) {
    // Validate API key
    const apiKey = getApiKey(request.headers);
    try {
      const auth = await validateApiKey(ctx, apiKey);

      // Clone the request with the rewritten URL for Hono routing
      const modifiedRequest = new Request(honoUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // We need to set context in the Hono app
      // Use middleware to inject ctx, userId, personId
      app.use('*', async (c, next) => {
        c.set('ctx', ctx);
        c.set('userId', auth.userId);
        c.set('personId', auth.personId);
        await next();
      });

      return app.fetch(modifiedRequest);
    } catch (error) {
      if (error instanceof HTTPException) {
        return new Response(
          JSON.stringify({
            success: false,
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

  // For public paths, create request with rewritten URL and set ctx
  const publicRequest = new Request(honoUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  app.use('*', async (c, next) => {
    c.set('ctx', ctx);
    await next();
  });

  return app.fetch(publicRequest);
});

// Note: Internal queries and mutations are at convex/api/v1/internal/*
// They are automatically exposed via the internal API object

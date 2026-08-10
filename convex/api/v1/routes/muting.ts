import {
  OpenAPIHono,
  createRoute,
  z,
  extendZodWithOpenApi,
} from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import {
  ErrorResponseSchema,
  EventIdParamSchema,
  MessageResponseSchema,
  PostIdParamSchema,
} from '../schemas/common';
import { MutedListResponseSchema } from '../schemas/muting';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createMutingRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /muting - List muted events and posts
  const listMutedRoute = createRoute({
    method: 'get',
    path: '/muting',
    tags: ['Muting'],
    summary: 'List muted items',
    description:
      'Get all muted events and posts for the authenticated user. Optionally filter by type.',
    security: [{ apiKey: [] }],
    request: {
      query: z.object({
        type: z.enum(['events', 'posts']).optional().openapi({
          example: 'events',
          description: 'Filter to only events or posts',
        }),
      }),
    },
    responses: {
      200: {
        description: 'List of muted items',
        content: {
          'application/json': {
            schema: MutedListResponseSchema,
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

  app.openapi(listMutedRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { type } = c.req.valid('query');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.muting.listMuted;
    const result = await ctx.runQuery(listFn, { personId, type });

    return c.json(
      {
        events: result.events,
        posts: result.posts,
      },
      200
    );
  });

  // POST /muting/events/:eventId - Mute an event
  const muteEventRoute = createRoute({
    method: 'post',
    path: '/muting/events/{eventId}',
    tags: ['Muting'],
    summary: 'Mute event',
    description:
      'Mute an event to stop receiving notifications for it. Requires event membership.',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'Event muted',
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
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Event not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(muteEventRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const muteFn = internal.api.v1.internal.muting.muteEvent;
      const result = await ctx.runMutation(muteFn, { personId, eventId });

      const message = result.alreadyMuted
        ? 'Event was already muted'
        : 'Event muted successfully';

      return c.json({ message }, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to mute event';
      const code = message.includes('not a member') ? 'FORBIDDEN' : 'NOT_FOUND';
      const status = code === 'FORBIDDEN' ? 403 : 404;

      return c.json(
        {
          error: { code, message },
        },
        status
      );
    }
  });

  // DELETE /muting/events/:eventId - Unmute an event
  const unmuteEventRoute = createRoute({
    method: 'delete',
    path: '/muting/events/{eventId}',
    tags: ['Muting'],
    summary: 'Unmute event',
    description: 'Unmute an event to resume receiving notifications for it',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      204: {
        description: 'Event unmuted successfully',
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
        description: 'Event is not muted',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(unmuteEventRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const unmuteFn = internal.api.v1.internal.muting.unmuteEvent;
      await ctx.runMutation(unmuteFn, { personId, eventId });

      return c.body(null, 204);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Event is not muted';
      return c.json(
        {
          error: { code: 'NOT_FOUND', message },
        },
        404
      );
    }
  });

  // POST /muting/posts/:postId - Mute a post
  const mutePostRoute = createRoute({
    method: 'post',
    path: '/muting/posts/{postId}',
    tags: ['Muting'],
    summary: 'Mute post',
    description:
      'Mute a post to stop receiving notifications for replies. Requires event membership.',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
    },
    responses: {
      200: {
        description: 'Post muted',
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
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Post not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(mutePostRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const muteFn = internal.api.v1.internal.muting.mutePost;
      const result = await ctx.runMutation(muteFn, { personId, postId });

      const message = result.alreadyMuted
        ? 'Post was already muted'
        : 'Post muted successfully';

      return c.json({ message }, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to mute post';
      const code = message.includes('not a member') ? 'FORBIDDEN' : 'NOT_FOUND';
      const status = code === 'FORBIDDEN' ? 403 : 404;

      return c.json(
        {
          error: { code, message },
        },
        status
      );
    }
  });

  // DELETE /muting/posts/:postId - Unmute a post
  const unmutePostRoute = createRoute({
    method: 'delete',
    path: '/muting/posts/{postId}',
    tags: ['Muting'],
    summary: 'Unmute post',
    description: 'Unmute a post to resume receiving notifications for replies',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
    },
    responses: {
      204: {
        description: 'Post unmuted successfully',
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
        description: 'Post is not muted',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(unmutePostRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const unmuteFn = internal.api.v1.internal.muting.unmutePost;
      await ctx.runMutation(unmuteFn, { personId, postId });

      return c.body(null, 204);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Post is not muted';
      return c.json(
        {
          error: { code: 'NOT_FOUND', message },
        },
        404
      );
    }
  });

  return app;
}

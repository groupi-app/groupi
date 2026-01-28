import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { requireEventMembership, canModifyPost } from '../middleware/auth';
import {
  ErrorResponseSchema,
  EventIdParamSchema,
  PostIdParamSchema,
} from '../schemas/common';
import {
  PostListResponseSchema,
  PostResponseSchema,
  PostCreateResponseSchema,
  CreatePostRequestSchema,
  UpdatePostRequestSchema,
} from '../schemas/posts';
import { HTTPException } from 'hono/http-exception';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createPostRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /events/:eventId/posts - List event posts
  const listPostsRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/posts',
    tags: ['Posts'],
    summary: 'List posts',
    description: 'Get all posts for an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'List of posts',
        content: {
          'application/json': {
            schema: PostListResponseSchema,
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
    },
  });

  app.openapi(listPostsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.posts.listEventPosts;
    const result = await ctx.runQuery(listFn, { eventId });

    return c.json(
      {
        success: true as const,
        data: result.posts,
      },
      200
    );
  });

  // POST /events/:eventId/posts - Create post
  const createPostRoute = createRoute({
    method: 'post',
    path: '/events/{eventId}/posts',
    tags: ['Posts'],
    summary: 'Create post',
    description: 'Create a new post in an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: CreatePostRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Post created',
        content: {
          'application/json': {
            schema: PostCreateResponseSchema,
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
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(createPostRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');
    const body = c.req.valid('json');

    const membership = await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const createFn = internal.api.v1.internal.posts.createPost;
    const result = await ctx.runMutation(createFn, {
      eventId,
      personId,
      membershipId: membership.membershipId,
      ...body,
    });

    return c.json(
      {
        success: true as const,
        data: {
          postId: result.postId,
        },
      },
      201
    );
  });

  // GET /posts/:postId - Get post details
  const getPostRoute = createRoute({
    method: 'get',
    path: '/posts/{postId}',
    tags: ['Posts'],
    summary: 'Get post',
    description: 'Get details of a specific post with replies',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
    },
    responses: {
      200: {
        description: 'Post details',
        content: {
          'application/json': {
            schema: PostResponseSchema,
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
        description: 'Forbidden - not a member of the event',
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

  app.openapi(getPostRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.posts.getPostDetail;
    const result = await ctx.runQuery(getFn, { postId, personId });

    if (!result) {
      return c.json(
        {
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Post not found' },
        },
        404
      );
    }

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // PATCH /posts/:postId - Update post
  const updatePostRoute = createRoute({
    method: 'patch',
    path: '/posts/{postId}',
    tags: ['Posts'],
    summary: 'Update post',
    description: 'Update a post (requires author or MODERATOR role)',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdatePostRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Post updated',
        content: {
          'application/json': {
            schema: PostResponseSchema,
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
        description: 'Forbidden - not author or moderator',
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

  app.openapi(updatePostRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');
    const body = c.req.valid('json');

    const canModify = await canModifyPost(ctx, postId, personId);
    if (!canModify) {
      throw new HTTPException(403, {
        message: 'You do not have permission to edit this post',
      });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateFn = internal.api.v1.internal.posts.updatePost;
    const result = await ctx.runMutation(updateFn, { postId, ...body });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // DELETE /posts/:postId - Delete post
  const deletePostRoute = createRoute({
    method: 'delete',
    path: '/posts/{postId}',
    tags: ['Posts'],
    summary: 'Delete post',
    description: 'Delete a post (requires author or MODERATOR role)',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
    },
    responses: {
      200: {
        description: 'Post deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ message: z.string() }),
            }),
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
        description: 'Forbidden - not author or moderator',
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

  app.openapi(deletePostRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');

    const canModify = await canModifyPost(ctx, postId, personId);
    if (!canModify) {
      throw new HTTPException(403, {
        message: 'You do not have permission to delete this post',
      });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const deleteFn = internal.api.v1.internal.posts.deletePost;
    await ctx.runMutation(deleteFn, { postId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Post deleted successfully' },
      },
      200
    );
  });

  return app;
}

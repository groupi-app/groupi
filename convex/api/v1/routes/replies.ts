import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { canModifyReply } from '../middleware/auth';
import {
  ErrorResponseSchema,
  PostIdParamSchema,
  ReplyIdParamSchema,
} from '../schemas/common';
import {
  ReplyListResponseSchema,
  ReplyResponseSchema,
  ReplyCreateResponseSchema,
  CreateReplyRequestSchema,
  UpdateReplyRequestSchema,
} from '../schemas/replies';
import { HTTPException } from 'hono/http-exception';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createReplyRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /posts/:postId/replies - List post replies
  const listRepliesRoute = createRoute({
    method: 'get',
    path: '/posts/{postId}/replies',
    tags: ['Replies'],
    summary: 'List replies',
    description: 'Get all replies for a post',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
    },
    responses: {
      200: {
        description: 'List of replies',
        content: {
          'application/json': {
            schema: ReplyListResponseSchema,
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

  app.openapi(listRepliesRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.replies.listPostReplies;
    const result = await ctx.runQuery(listFn, { postId, personId });

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
        data: result.replies,
      },
      200
    );
  });

  // POST /posts/:postId/replies - Create reply
  const createReplyRoute = createRoute({
    method: 'post',
    path: '/posts/{postId}/replies',
    tags: ['Replies'],
    summary: 'Create reply',
    description: 'Create a new reply to a post',
    security: [{ apiKey: [] }],
    request: {
      params: PostIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: CreateReplyRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Reply created',
        content: {
          'application/json': {
            schema: ReplyCreateResponseSchema,
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

  app.openapi(createReplyRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { postId } = c.req.valid('param');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const createFn = internal.api.v1.internal.replies.createReply;
    const result = await ctx.runMutation(createFn, {
      postId,
      personId,
      ...body,
    });

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
        data: {
          replyId: result.replyId,
        },
      },
      201
    );
  });

  // PATCH /replies/:replyId - Update reply
  const updateReplyRoute = createRoute({
    method: 'patch',
    path: '/replies/{replyId}',
    tags: ['Replies'],
    summary: 'Update reply',
    description: 'Update a reply (requires author or MODERATOR role)',
    security: [{ apiKey: [] }],
    request: {
      params: ReplyIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateReplyRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Reply updated',
        content: {
          'application/json': {
            schema: ReplyResponseSchema,
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
        description: 'Reply not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(updateReplyRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { replyId } = c.req.valid('param');
    const body = c.req.valid('json');

    const canModify = await canModifyReply(ctx, replyId, personId);
    if (!canModify) {
      throw new HTTPException(403, {
        message: 'You do not have permission to edit this reply',
      });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateFn = internal.api.v1.internal.replies.updateReply;
    const result = await ctx.runMutation(updateFn, { replyId, ...body });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // DELETE /replies/:replyId - Delete reply
  const deleteReplyRoute = createRoute({
    method: 'delete',
    path: '/replies/{replyId}',
    tags: ['Replies'],
    summary: 'Delete reply',
    description: 'Delete a reply (requires author or MODERATOR role)',
    security: [{ apiKey: [] }],
    request: {
      params: ReplyIdParamSchema,
    },
    responses: {
      200: {
        description: 'Reply deleted',
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
        description: 'Reply not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteReplyRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { replyId } = c.req.valid('param');

    const canModify = await canModifyReply(ctx, replyId, personId);
    if (!canModify) {
      throw new HTTPException(403, {
        message: 'You do not have permission to delete this reply',
      });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const deleteFn = internal.api.v1.internal.replies.deleteReply;
    await ctx.runMutation(deleteFn, { replyId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Reply deleted successfully' },
      },
      200
    );
  });

  return app;
}

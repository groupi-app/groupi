import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import { internal } from '../../../_generated/api';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { ErrorResponseSchema, MessageResponseSchema } from '../schemas/common';
import {
  SocialPageQuerySchema,
  BlockPageResponseSchema,
} from '../schemas/friends';
type Variables = { ctx: ActionCtx; userId: string; personId: string };
export function createBlockRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  const errors = {
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'User not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  };
  app.openapi(
    createRoute({
      method: 'get',
      path: '/blocks',
      tags: ['Friends'],
      summary: 'List blocked users (bounded cursor pages)',
      security: [{ apiKey: [] }],
      request: { query: SocialPageQuerySchema },
      responses: {
        200: {
          description: 'Blocked users',
          content: { 'application/json': { schema: BlockPageResponseSchema } },
        },
        ...errors,
      },
    }),
    async c => {
      const q = c.req.valid('query');
      return c.json(
        BlockPageResponseSchema.parse(
          await c
            .get('ctx')
            .runQuery(internal.api.v1.internal.social.listPage, {
              personId: c.get('personId') as Id<'persons'>,
              kind: 'blocks',
              limit: q.limit ?? 20,
              cursor: q.cursor ?? null,
            })
        ),
        200
      );
    }
  );
  const params = z.object({ personId: z.string().min(1) });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/blocks/{personId}',
      tags: ['Friends'],
      summary: 'Inspect block relationship',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Block status',
          content: {
            'application/json': {
              schema: z.object({
                blockedByMe: z.boolean(),
                blockedByThem: z.boolean(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runQuery(internal.api.v1.internal.social.blockStatus, {
            personId: c.get('personId') as Id<'persons'>,
            targetPersonId: c.req.valid('param').personId as Id<'persons'>,
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/blocks/{personId}',
      tags: ['Friends'],
      summary: 'Block user and remove friendships/requests',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Blocked',
          content: { 'application/json': { schema: MessageResponseSchema } },
        },
        ...errors,
      },
    }),
    async c => {
      const result = await c
        .get('ctx')
        .runMutation(internal.api.v1.internal.social.changeBlock, {
          personId: c.get('personId') as Id<'persons'>,
          targetPersonId: c.req.valid('param').personId as Id<'persons'>,
          blocked: true,
        });
      return c.json({ message: result.message }, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/blocks/{personId}',
      tags: ['Friends'],
      summary: 'Unblock user',
      security: [{ apiKey: [] }],
      request: { params },
      responses: { 204: { description: 'Unblocked' }, ...errors },
    }),
    async c => {
      await c
        .get('ctx')
        .runMutation(internal.api.v1.internal.social.changeBlock, {
          personId: c.get('personId') as Id<'persons'>,
          targetPersonId: c.req.valid('param').personId as Id<'persons'>,
          blocked: false,
        });
      return c.body(null, 204);
    }
  );
  return app;
}

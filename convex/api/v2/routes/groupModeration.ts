import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
import {
  GroupPersonSchema,
  GroupPageQuerySchema,
} from '../schemas/groupInvites';
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409].map(status => [
    status,
    {
      description:
        'Invalid input, unavailable resource or insufficient Group authority',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  ])
);
const params = z.object({
  groupId: z.string().min(1).max(512),
  personId: z.string().min(1).max(512),
});
export function createGroupModerationRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/bans',
      tags: ['Groups'],
      summary: 'List active Group bans as manager',
      security: [{ apiKey: [] }],
      request: {
        params: params.omit({ personId: true }),
        query: GroupPageQuerySchema,
      },
      responses: {
        200: {
          description: 'Private active ban page',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(
                  GroupPersonSchema.extend({ bannedAt: z.number() })
                ),
                nextCursor: z.string().nullable(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const { limit, cursor } = c.req.valid('query');
      const result = await c
        .get('ctx')
        .runQuery(internal.groupModeration.rest.list, {
          actorId: c.get('personId') as Id<'persons'>,
          groupId: c.req.param('groupId'),
          paginationOpts: { numItems: limit, cursor: cursor ?? null },
        });
      return c.json(
        {
          items: result.page,
          nextCursor: result.isDone ? null : result.continueCursor,
        },
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}/members/{personId}/role',
      tags: ['Groups'],
      summary: 'Appoint or demote a Group moderator as owner',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          content: {
            'application/json': {
              schema: z
                .object({ role: z.enum(['MODERATOR', 'MEMBER']) })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Saved role',
          content: {
            'application/json': {
              schema: z.object({ role: z.enum(['MODERATOR', 'MEMBER']) }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const result = await c
        .get('ctx')
        .runMutation(internal.groupModeration.rest.role, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}/members/{personId}',
      tags: ['Groups'],
      summary: 'Remove an ordinary member without banning',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Member removal result',
          content: {
            'application/json': { schema: z.object({ removed: z.boolean() }) },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const result = await c
        .get('ctx')
        .runMutation(internal.groupModeration.rest.remove, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        });
      return c.json(result, 200);
    }
  );
  for (const method of ['put', 'delete'] as const) {
    app.openapi(
      createRoute({
        method,
        path: '/groups/{groupId}/bans/{personId}',
        tags: ['Groups'],
        summary:
          method === 'put'
            ? 'Ban an ordinary member or nonmember'
            : 'Lift a Group ban without admitting membership',
        security: [{ apiKey: [] }],
        request: { params },
        responses: {
          200: {
            description: 'Ban result',
            content: {
              'application/json': { schema: z.object({ banned: z.boolean() }) },
            },
          },
          ...errors,
        },
      }),
      async c => {
        const input = {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        };
        const result =
          method === 'put'
            ? await c
                .get('ctx')
                .runMutation(internal.groupModeration.rest.ban, input)
            : await c
                .get('ctx')
                .runMutation(internal.groupModeration.rest.lift, input);
        return c.json(result, 200);
      }
    );
  }
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/leave',
      tags: ['Groups'],
      summary: 'Leave your own Group membership',
      security: [{ apiKey: [] }],
      request: { params: params.omit({ personId: true }) },
      responses: {
        200: {
          description: 'Leave result',
          content: {
            'application/json': { schema: z.object({ left: z.boolean() }) },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const result = await c
        .get('ctx')
        .runMutation(internal.groupModeration.rest.leave, {
          actorId: c.get('personId') as Id<'persons'>,
          groupId: c.req.param('groupId'),
        });
      return c.json(result, 200);
    }
  );
  return app;
}

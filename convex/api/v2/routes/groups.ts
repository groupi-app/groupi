import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { internal } from '../../../_generated/api';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';

const identity = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).optional(),
    image: z.string().url().max(2048).optional(),
  })
  .strict();
const group = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  role: z.enum(['OWNER', 'MODERATOR', 'MEMBER']),
  viewerRole: z.enum(['OWNER', 'MODERATOR', 'MEMBER']),
  canManageIdentity: z.boolean(),
  memberCount: z.number(),
  invitationsEnabled: z.boolean(),
  canManageInvitations: z.boolean(),
  canManageMembers: z.boolean(),
  canManageRoles: z.boolean(),
  canLeave: z.boolean(),
});
const params = z.object({ groupId: z.string().min(1).max(512) });
const errors = {
  400: {
    description: 'Invalid identity or pagination',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Authentication required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Owner authority or Group scope required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Group unavailable',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createGroupRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups',
      tags: ['Groups'],
      summary: 'List your Groups',
      security: [{ apiKey: [] }],
      request: {
        query: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20),
          cursor: z.string().max(4096).optional(),
        }),
      },
      responses: {
        200: {
          description: 'Paginated admitted Groups',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(group),
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
      const result = await c.get('ctx').runQuery(internal.groups.rest.list, {
        personId: c.get('personId') as Id<'persons'>,
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
      method: 'post',
      path: '/groups',
      tags: ['Groups'],
      summary: 'Create an owner-only Group',
      security: [{ apiKey: [] }],
      request: {
        body: {
          required: true,
          content: { 'application/json': { schema: identity } },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': { schema: z.object({ groupId: z.string() }) },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        {
          groupId: await c.get('ctx').runMutation(internal.groups.rest.create, {
            personId: c.get('personId') as Id<'persons'>,
            ...c.req.valid('json'),
          }),
        },
        201
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}',
      tags: ['Groups'],
      summary: 'Read an admitted Group',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Group identity and membership role',
          content: { 'application/json': { schema: group } },
        },
        ...errors,
      },
    }),
    async c => {
      const result = await c.get('ctx').runQuery(internal.groups.rest.get, {
        personId: c.get('personId') as Id<'persons'>,
        groupId: c.req.valid('param').groupId as Id<'groups'>,
      });
      if (!result)
        throw new HTTPException(404, { message: 'Group unavailable' });
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}',
      tags: ['Groups'],
      summary: 'Update Group identity as owner',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: identity
                .partial()
                .extend({
                  description: z
                    .string()
                    .trim()
                    .max(2000)
                    .nullable()
                    .optional(),
                  image: z.string().url().max(2048).nullable().optional(),
                })
                .strict(),
            },
          },
        },
      },
      responses: { 204: { description: 'Updated' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groups.rest.update, {
        personId: c.get('personId') as Id<'persons'>,
        groupId: c.req.valid('param').groupId as Id<'groups'>,
        ...c.req.valid('json'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}',
      tags: ['Groups'],
      summary: 'Explicitly delete a Group as owner',
      security: [{ apiKey: [] }],
      request: { params },
      responses: { 204: { description: 'Deleted' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groups.rest.remove, {
        personId: c.get('personId') as Id<'persons'>,
        groupId: c.req.valid('param').groupId as Id<'groups'>,
      });
      return c.body(null, 204);
    }
  );
  return app;
}

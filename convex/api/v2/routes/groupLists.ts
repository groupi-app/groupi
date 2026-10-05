import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
const group = z.object({ groupId: z.string().min(1).max(512) });
const target = group.extend({ toolId: z.string().min(1).max(512) });
const entryTarget = target.extend({ entryId: z.string().min(1).max(512) });
const config = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();
const page = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(4096).optional(),
});
const tool = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  groupId: z.string(),
  kind: z.enum(['FORM', 'POLL', 'LIST']),
  title: z.string(),
  description: z.string(),
  resultsVisibility: z.enum(['MANAGERS', 'MEMBERS']),
  creatorId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
const settings = tool.extend({ version: z.number(), canManage: z.boolean() });
const entry = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  toolId: z.string(),
  groupId: z.string(),
  personId: z.string().optional(),
  actorId: z.string().optional(),
  listTitle: z.string(),
  text: z.string(),
  completed: z.boolean(),
  revision: z.number(),
  canEdit: z.boolean(),
  canRemove: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
const toolPage = z.object({
  page: z.array(tool),
  isDone: z.boolean(),
  continueCursor: z.string(),
});
const entryPage = z.object({
  page: z.array(entry),
  isDone: z.boolean(),
  continueCursor: z.string(),
});
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409].map(status => [
    status,
    {
      description:
        'Invalid input, stale revision, unavailable list or current authority required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  ])
);
export function createGroupListRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/lists',
      tags: ['Groups'],
      summary: 'list persistent Group lists',
      security: [{ apiKey: [] }],
      request: { params: group, query: page },
      responses: {
        200: {
          description: 'Stored list state with current visibility',
          content: { 'application/json': { schema: toolPage } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupLists.rest.list, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          paginationOpts: {
            numItems: c.req.valid('query').limit,
            cursor: c.req.valid('query').cursor ?? null,
          },
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/lists/{toolId}',
      tags: ['Groups'],
      summary: 'get persistent Group lists',
      security: [{ apiKey: [] }],
      request: { params: target },
      responses: {
        200: {
          description: 'Stored list state with current visibility',
          content: { 'application/json': { schema: settings } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupLists.rest.get, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/lists/{toolId}/settings',
      tags: ['Groups'],
      summary: 'settings persistent Group lists',
      security: [{ apiKey: [] }],
      request: { params: target },
      responses: {
        200: {
          description: 'Stored list state with current visibility',
          content: { 'application/json': { schema: settings } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupLists.rest.settings, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/lists/{toolId}/entries',
      tags: ['Groups'],
      summary: 'entries persistent Group lists',
      security: [{ apiKey: [] }],
      request: { params: target, query: page },
      responses: {
        200: {
          description: 'Stored list state with current visibility',
          content: { 'application/json': { schema: entryPage } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupLists.rest.entries, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          paginationOpts: {
            numItems: c.req.valid('query').limit,
            cursor: c.req.valid('query').cursor ?? null,
          },
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/lists/{toolId}/own',
      tags: ['Groups'],
      summary: 'own persistent Group lists',
      security: [{ apiKey: [] }],
      request: { params: target, query: page },
      responses: {
        200: {
          description: 'Stored list state with current visibility',
          content: { 'application/json': { schema: entryPage } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupLists.rest.own, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          paginationOpts: {
            numItems: c.req.valid('query').limit,
            cursor: c.req.valid('query').cursor ?? null,
          },
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/lists',
      tags: ['Groups'],
      summary: 'create persistent Group list',
      security: [{ apiKey: [] }],
      request: {
        params: group,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: config
                .extend({ resultsVisibility: z.enum(['MANAGERS', 'MEMBERS']) })
                .strict(),
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Stored list operation',
          content: {
            'application/json': { schema: z.object({ toolId: z.string() }) },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        {
          toolId: await c
            .get('ctx')
            .runMutation(internal.groupLists.rest.create, {
              personId: c.get('personId') as Id<'persons'>,
              ...c.req.valid('param'),
              ...c.req.valid('json'),
            }),
        },
        201
      )
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}/lists/{toolId}',
      tags: ['Groups'],
      summary: 'configure persistent Group list',
      security: [{ apiKey: [] }],
      request: {
        params: target,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: config
                .extend({ version: z.number().int().positive() })
                .strict(),
            },
          },
        },
      },
      responses: { 204: { description: 'Stored list operation' }, ...errors },
    }),
    async c => {
      await await c.get('ctx').runMutation(internal.groupLists.rest.configure, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
        ...c.req.valid('json'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/lists/{toolId}/entries',
      tags: ['Groups'],
      summary: 'add persistent Group list',
      security: [{ apiKey: [] }],
      request: {
        params: target,
        headers: z.object({ 'idempotency-key': z.string().min(1).max(100) }),
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  version: z.number().int().positive(),
                  text: z.string().trim().min(1).max(2000),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Stored list operation',
          content: {
            'application/json': {
              schema: z.object({
                entryId: z.string(),
                state: z.enum(['PRESENT', 'REMOVED']),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.groupLists.rest.add, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
          requestId: c.req.valid('header')['idempotency-key'],
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}/lists/{toolId}/entries/{entryId}',
      tags: ['Groups'],
      summary: 'edit persistent Group list',
      security: [{ apiKey: [] }],
      request: {
        params: entryTarget,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  version: z.number().int().positive(),
                  expectedRevision: z.number().int().positive(),
                  text: z.string().trim().min(1).max(2000),
                  completed: z.boolean(),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Stored list operation',
          content: {
            'application/json': { schema: z.object({ revision: z.number() }) },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.groupLists.rest.edit, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}/lists/{toolId}/entries/{entryId}',
      tags: ['Groups'],
      summary: 'removeEntry persistent Group list',
      security: [{ apiKey: [] }],
      request: {
        params: entryTarget,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ expectedRevision: z.number().int().positive() })
                .strict(),
            },
          },
        },
      },
      responses: { 204: { description: 'Stored list operation' }, ...errors },
    }),
    async c => {
      await await c
        .get('ctx')
        .runMutation(internal.groupLists.rest.removeEntry, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}/lists/{toolId}',
      tags: ['Groups'],
      summary: 'remove persistent Group list',
      security: [{ apiKey: [] }],
      request: { params: target },
      responses: { 204: { description: 'Stored list operation' }, ...errors },
    }),
    async c => {
      await await c.get('ctx').runMutation(internal.groupLists.rest.remove, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/list-policy',
      tags: ['Groups'],
      summary: 'Read owner list availability and creation policy',
      security: [{ apiKey: [] }],
      request: { params: group },
      responses: {
        200: {
          description: 'Owner policy',
          content: {
            'application/json': {
              schema: z.object({
                groupId: z.string(),
                kind: z.literal('LIST'),
                enabled: z.boolean(),
                creation: z.enum(['MANAGERS', 'MEMBERS']),
                canConfigure: z.boolean(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupLists.rest.policy, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/groups/{groupId}/list-policy',
      tags: ['Groups'],
      summary: 'Owner configures list availability and creation',
      security: [{ apiKey: [] }],
      request: {
        params: group,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  enabled: z.boolean(),
                  creation: z.enum(['MANAGERS', 'MEMBERS']),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated policy',
          content: {
            'application/json': { schema: z.object({ success: z.boolean() }) },
          },
        },
        ...errors,
      },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupLists.rest.configurePolicy, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
        ...c.req.valid('json'),
      });
      return c.json({ success: true }, 200);
    }
  );
  return app;
}

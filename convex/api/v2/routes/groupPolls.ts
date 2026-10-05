import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
const option = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    label: z.string().trim().min(1).max(200),
  })
  .strict();
const mode = z.enum(['SINGLE', 'MULTIPLE']);
const config = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).optional(),
    mode,
    options: z.array(option).min(2).max(50),
  })
  .strict();
const params = z.object({
  groupId: z.string().min(1).max(512),
  toolId: z.string().min(1).max(512),
});
const pageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(4096).optional(),
});
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409].map(status => [
    status,
    {
      description:
        'Invalid input, stale version, unavailable tool or current Group authority required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  ])
);
const toolSchema = z.object({
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
const pollSchema = toolSchema.extend({
  version: z.number(),
  semanticVersion: z.number(),
  mode,
  options: z.array(option),
  selections: z.array(z.string()),
  savedOptions: z.array(option),
  savedVersion: z.number().nullable(),
  voteRevision: z.number(),
  canManage: z.boolean(),
  canReview: z.boolean(),
  enabled: z.boolean(),
});
const managementSchema = toolSchema.extend({
  version: z.number(),
  semanticVersion: z.number(),
  mode,
  options: z.array(option),
  canManage: z.literal(true),
});
const voteSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  toolId: z.string(),
  groupId: z.string(),
  personId: z.string().optional(),
  revision: z.number(),
  version: z.number(),
  semanticVersion: z.number(),
  mode,
  options: z.array(option),
  selections: z.array(z.string()),
  removed: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
const toolPage = z.object({
  page: z.array(toolSchema),
  isDone: z.boolean(),
  continueCursor: z.string(),
});
const votePage = z.object({
  page: z.array(voteSchema.extend({ isCurrent: z.boolean() })),
  isDone: z.boolean(),
  continueCursor: z.string(),
});
const policySchema = z.object({
  groupId: z.string(),
  kind: z.literal('POLL'),
  enabled: z.boolean(),
  creation: z.enum(['MANAGERS', 'MEMBERS']),
  canConfigure: z.boolean(),
});
export function createGroupPollRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/polls',
      tags: ['Groups'],
      summary: 'Create an independent persistent persistent poll',
      security: [{ apiKey: [] }],
      request: {
        params: params.omit({ toolId: true }),
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
          description: 'Created persistent poll',
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
            .runMutation(internal.groupPolls.rest.create, {
              personId: c.get('personId') as Id<'persons'>,
              groupId: c.req.valid('param').groupId,
              ...c.req.valid('json'),
            }),
        },
        201
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/polls',
      tags: ['Groups'],
      summary:
        'List persistent polls independently of the joining questionnaire',
      security: [{ apiKey: [] }],
      request: { params: params.omit({ toolId: true }), query: pageQuery },
      responses: {
        200: {
          description: 'Indexed page',
          content: { 'application/json': { schema: toolPage } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupPolls.rest.list, {
          personId: c.get('personId') as Id<'persons'>,
          groupId: c.req.valid('param').groupId,
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
      path: '/groups/{groupId}/polls/{toolId}/settings',
      tags: ['Groups'],
      summary:
        'Read preserved poll configuration as a current eligible manager, including while disabled',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Manager configuration without vote data',
          content: { 'application/json': { schema: managementSchema } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupPolls.rest.settings, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        }),
        200
      )
  );
  for (const operation of ['get', 'history', 'results'] as const) {
    app.openapi(
      createRoute({
        method: 'get',
        path:
          operation === 'get'
            ? '/groups/{groupId}/polls/{toolId}'
            : `/groups/{groupId}/polls/{toolId}/${operation}`,
        tags: ['Groups'],
        summary:
          operation === 'history'
            ? 'Read only your retained vote snapshots'
            : operation === 'results'
              ? 'Read stated-visibility latest votes'
              : 'Read current poll and your compatible selections',
        security: [{ apiKey: [] }],
        request: { params, query: pageQuery },
        responses: {
          200: {
            description: 'Poll data with stated privacy',
            content: {
              'application/json': {
                schema:
                  operation === 'get'
                    ? pollSchema
                    : operation === 'history'
                      ? votePage.extend({
                          voteRevision: z.number().int().nonnegative(),
                          page: z.array(voteSchema),
                        })
                      : votePage,
              },
            },
          },
          ...errors,
        },
      }),
      async c => {
        const input = {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        };
        if (operation === 'get')
          return c.json(
            await c.get('ctx').runQuery(internal.groupPolls.rest.get, input),
            200
          );
        return c.json(
          await c.get('ctx').runQuery(internal.groupPolls.rest[operation], {
            ...input,
            paginationOpts: {
              numItems: c.req.valid('query').limit,
              cursor: c.req.valid('query').cursor ?? null,
            },
          }),
          200
        );
      }
    );
  }
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}/polls/{toolId}',
      tags: ['Groups'],
      summary:
        'Manage current poll configuration without erasing saved definitions',
      security: [{ apiKey: [] }],
      request: {
        params,
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
      responses: { 204: { description: 'Updated' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupPolls.rest.configure, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
        ...c.req.valid('json'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/groups/{groupId}/polls/{toolId}/vote',
      tags: ['Groups'],
      summary:
        'Submit or edit your validated vote using current poll and vote revisions',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  version: z.number().int().positive(),
                  expectedRevision: z.number().int().nonnegative(),
                  selections: z.array(z.string()).min(1).max(50),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Saved revision; exact repeat is recovery',
          content: {
            'application/json': {
              schema: z.object({ revision: z.number().int().positive() }),
            },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.groupPolls.rest.submit, {
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
      path: '/groups/{groupId}/polls/{toolId}/vote',
      tags: ['Groups'],
      summary: 'Remove your vote and private history using optimistic revision',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ expectedRevision: z.number().int().nonnegative() })
                .strict(),
            },
          },
        },
      },
      responses: { 204: { description: 'Removed' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupPolls.rest.removeOwn, {
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
      path: '/groups/{groupId}/polls/{toolId}',
      tags: ['Groups'],
      summary: 'Delete a poll and all votes as a current eligible manager',
      security: [{ apiKey: [] }],
      request: { params },
      responses: { 204: { description: 'Removed' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupPolls.rest.remove, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}/polls/{toolId}/results/{voteId}',
      tags: ['Groups'],
      summary:
        'Moderate a current ordinary vote including anonymous shared content',
      security: [{ apiKey: [] }],
      request: {
        params: params.extend({ voteId: z.string().min(1).max(512) }),
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ expectedRevision: z.number().int().nonnegative() })
                .strict(),
            },
          },
        },
      },
      responses: { 204: { description: 'Removed' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupPolls.rest.moderate, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
        ...c.req.valid('json'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/poll-policy',
      tags: ['Groups'],
      summary: 'Read poll availability/creation policy',
      security: [{ apiKey: [] }],
      request: { params: params.omit({ toolId: true }) },
      responses: {
        200: {
          description: 'Policy',
          content: { 'application/json': { schema: policySchema } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupPolls.rest.getPolicy, {
          personId: c.get('personId') as Id<'persons'>,
          groupId: c.req.valid('param').groupId,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/groups/{groupId}/poll-policy',
      tags: ['Groups'],
      summary: 'Owner controls poll availability and creation',
      security: [{ apiKey: [] }],
      request: {
        params: params.omit({ toolId: true }),
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
          description: 'Updated',
          content: {
            'application/json': { schema: z.object({ success: z.boolean() }) },
          },
        },
        ...errors,
      },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupPolls.rest.configurePolicy, {
        personId: c.get('personId') as Id<'persons'>,
        groupId: c.req.valid('param').groupId,
        ...c.req.valid('json'),
      });
      return c.json({ success: true }, 200);
    }
  );
  return app;
}

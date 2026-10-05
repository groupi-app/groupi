import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
import {
  GroupApplicationQuestionSchema as ApplicationQuestionSchema,
  GroupApplicationAnswersSchema as ApplicationAnswersSchema,
} from '../schemas/groupApplications';
const config = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).optional(),
    questions: z.array(ApplicationQuestionSchema).max(50),
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
const formSchema = toolSchema.extend({
  version: z.number(),
  questions: z.array(ApplicationQuestionSchema),
  answers: ApplicationAnswersSchema,
  savedQuestions: z.array(ApplicationQuestionSchema),
  savedVersion: z.number().nullable(),
  responseRevision: z.number(),
  canManage: z.boolean(),
  canReview: z.boolean(),
  enabled: z.boolean(),
});
const managementSchema = toolSchema.extend({
  version: z.number(),
  questions: z.array(ApplicationQuestionSchema),
  canManage: z.literal(true),
});
const responseSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  toolId: z.string(),
  groupId: z.string(),
  personId: z.string().optional(),
  revision: z.number(),
  version: z.number(),
  questions: z.array(ApplicationQuestionSchema),
  answers: ApplicationAnswersSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});
const toolPage = z.object({
  page: z.array(toolSchema),
  isDone: z.boolean(),
  continueCursor: z.string(),
});
const responsePage = z.object({
  page: z.array(responseSchema),
  isDone: z.boolean(),
  continueCursor: z.string(),
});
const policySchema = z.object({
  groupId: z.string(),
  kind: z.literal('FORM'),
  enabled: z.boolean(),
  creation: z.enum(['MANAGERS', 'MEMBERS']),
  canConfigure: z.boolean(),
});
export function createGroupFormRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/forms',
      tags: ['Groups'],
      summary: 'Create an independent persistent ordinary form',
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
          description: 'Created persistent form',
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
            .runMutation(internal.groupForms.rest.create, {
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
      path: '/groups/{groupId}/forms',
      tags: ['Groups'],
      summary: 'List ordinary forms independently of the joining questionnaire',
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
        await c.get('ctx').runQuery(internal.groupForms.rest.list, {
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
      path: '/groups/{groupId}/forms/{toolId}/settings',
      tags: ['Groups'],
      summary:
        'Read preserved form configuration as a current eligible manager, including while disabled',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Manager configuration without response data',
          content: { 'application/json': { schema: managementSchema } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupForms.rest.settings, {
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
            ? '/groups/{groupId}/forms/{toolId}'
            : `/groups/{groupId}/forms/{toolId}/${operation}`,
        tags: ['Groups'],
        summary:
          operation === 'history'
            ? 'Read only your retained response snapshots'
            : operation === 'results'
              ? 'Read stated-visibility latest responses'
              : 'Read current form and your compatible answers',
        security: [{ apiKey: [] }],
        request: { params, query: pageQuery },
        responses: {
          200: {
            description: 'Form data with stated privacy',
            content: {
              'application/json': {
                schema: operation === 'get' ? formSchema : responsePage,
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
            await c.get('ctx').runQuery(internal.groupForms.rest.get, input),
            200
          );
        return c.json(
          await c.get('ctx').runQuery(internal.groupForms.rest[operation], {
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
      path: '/groups/{groupId}/forms/{toolId}',
      tags: ['Groups'],
      summary:
        'Manage current form configuration without erasing saved definitions',
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
      await c.get('ctx').runMutation(internal.groupForms.rest.configure, {
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
      path: '/groups/{groupId}/forms/{toolId}/response',
      tags: ['Groups'],
      summary:
        'Submit or edit your validated response using current form and response revisions',
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
                  answers: ApplicationAnswersSchema,
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
        await c.get('ctx').runMutation(internal.groupForms.rest.submit, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        }),
        200
      )
  );
  for (const operation of ['remove', 'removeOwn'] as const)
    app.openapi(
      createRoute({
        method: 'delete',
        path:
          operation === 'remove'
            ? '/groups/{groupId}/forms/{toolId}'
            : '/groups/{groupId}/forms/{toolId}/response',
        tags: ['Groups'],
        summary:
          operation === 'remove'
            ? 'Explicitly delete form and all responses'
            : 'Remove your response and private retained history',
        security: [{ apiKey: [] }],
        request: { params },
        responses: { 204: { description: 'Removed' }, ...errors },
      }),
      async c => {
        await c.get('ctx').runMutation(internal.groupForms.rest[operation], {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        });
        return c.body(null, 204);
      }
    );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}/forms/{toolId}/results/{responseId}',
      tags: ['Groups'],
      summary:
        'Moderate a current ordinary response including anonymous shared content',
      security: [{ apiKey: [] }],
      request: {
        params: params.extend({ responseId: z.string().min(1).max(512) }),
      },
      responses: { 204: { description: 'Removed' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupForms.rest.moderate, {
        personId: c.get('personId') as Id<'persons'>,
        ...c.req.valid('param'),
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/form-policy',
      tags: ['Groups'],
      summary: 'Read form availability/creation policy',
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
        await c.get('ctx').runQuery(internal.groupForms.rest.getPolicy, {
          personId: c.get('personId') as Id<'persons'>,
          groupId: c.req.valid('param').groupId,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/groups/{groupId}/form-policy',
      tags: ['Groups'],
      summary: 'Owner controls form availability and creation',
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
      await c.get('ctx').runMutation(internal.groupForms.rest.configurePolicy, {
        personId: c.get('personId') as Id<'persons'>,
        groupId: c.req.valid('param').groupId,
        ...c.req.valid('json'),
      });
      return c.json({ success: true }, 200);
    }
  );
  return app;
}

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { internal } from '../../../_generated/api';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
const question = z
  .object({
    id: z.string().min(1).max(100),
    label: z.string().min(1).max(1000),
    required: z.boolean(),
    type: z.enum([
      'SHORT_ANSWER',
      'LONG_ANSWER',
      'MULTIPLE_CHOICE',
      'CHECKBOXES',
      'NUMBER',
      'DROPDOWN',
      'YES_NO',
    ]),
    options: z.array(z.string().min(1).max(500)).max(100).optional(),
  })
  .strict();
const savedQuestion = question.extend({ version: z.number() });
const answer = z.union([
  z.string().max(10000),
  z.number().finite(),
  z.boolean(),
  z.array(z.string()).max(100),
]);
const answers = z.record(z.string(), answer);
const form = z.object({
  groupId: z.string(),
  enabled: z.boolean(),
  requiredCompletion: z.boolean(),
  requiresCompletion: z.boolean(),
  canAccessMemberContent: z.boolean(),
  version: z.number(),
  questions: z.array(savedQuestion).max(50),
  answers,
  savedQuestions: z.array(savedQuestion).max(50),
  completed: z.boolean(),
  shouldPrompt: z.boolean(),
  canEdit: z.boolean(),
  canConfigure: z.boolean(),
  canReview: z.boolean(),
});
const history = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  groupId: z.string(),
  personId: z.string(),
  question: savedQuestion,
  answer: answer.optional(),
  answeredAt: z.number(),
});
const review = form.extend({
  author: z.object({
    personId: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
  }),
});
const params = z.object({ groupId: z.string().min(1).max(512) });
const query = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(4096).optional(),
});
const errors = {
  400: {
    description: 'Invalid questions, answers or paging',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Authentication required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Private record or current role required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Group unavailable',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  409: {
    description: 'Reload changed questionnaire',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createGroupQuestionnaireRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  const path = '/groups/{groupId}/joining-questionnaire';
  app.openapi(
    createRoute({
      method: 'get',
      path,
      tags: ['Groups'],
      summary:
        'Read your private joining questionnaire and current access status',
      security: [{ apiKey: [] }],
      request: { params },
      responses: {
        200: {
          description: 'Bounded own form and saved definitions',
          content: { 'application/json': { schema: form } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupQuestionnaires.rest.get, {
          groupId: c.req.valid('param').groupId,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'put',
      path,
      tags: ['Groups'],
      summary:
        'Configure the joining questionnaire and completion policy as Group owner',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  enabled: z.boolean(),
                  requiredCompletion: z.boolean().optional(),
                  questions: z.array(question).max(50),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Configuration preserves personal answers',
          content: { 'application/json': { schema: form } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.groupQuestionnaires.rest.configure, {
            groupId: c.req.valid('param').groupId,
            personId: c.get('personId') as Id<'persons'>,
            ...c.req.valid('json'),
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: path + '/answers',
      tags: ['Groups'],
      summary: 'Submit or edit private answers as an admitted member',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ version: z.number().int().min(1), answers })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Current private answers and completion status',
          content: { 'application/json': { schema: form } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.groupQuestionnaires.rest.submit, {
            groupId: c.req.valid('param').groupId,
            personId: c.get('personId') as Id<'persons'>,
            ...c.req.valid('json'),
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: path + '/responses',
      tags: ['Groups'],
      summary: 'Review private answers as current owner or moderator',
      security: [{ apiKey: [] }],
      request: { params, query },
      responses: {
        200: {
          description: 'Bounded private response page',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(review),
                nextCursor: z.string().nullable(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const q = c.req.valid('query');
      const result = await c
        .get('ctx')
        .runQuery(internal.groupQuestionnaires.rest.review, {
          groupId: c.req.valid('param').groupId,
          personId: c.get('personId') as Id<'persons'>,
          paginationOpts: { numItems: q.limit, cursor: q.cursor ?? null },
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
      method: 'get',
      path: path + '/history',
      tags: ['Groups'],
      summary:
        'Read own retained answer history or review an author as current manager',
      security: [{ apiKey: [] }],
      request: {
        params,
        query: query.extend({
          authorId: z.string().min(1).max(512).optional(),
        }),
      },
      responses: {
        200: {
          description: 'Preserved answered definitions and revisions',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(history),
                nextCursor: z.string().nullable(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const q = c.req.valid('query');
      const result = await c
        .get('ctx')
        .runQuery(internal.groupQuestionnaires.rest.history, {
          groupId: c.req.valid('param').groupId,
          personId: c.get('personId') as Id<'persons'>,
          authorId: q.authorId,
          paginationOpts: { numItems: q.limit, cursor: q.cursor ?? null },
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
  return app;
}

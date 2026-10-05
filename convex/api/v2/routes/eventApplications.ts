import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
type Variables = { ctx: ActionCtx; personId: string; userId: string };
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
const settings = z
  .object({
    questions: z.array(question).max(50),
    reviewerPolicy: z.enum(['ORGANIZERS_AND_MODERATORS', 'ORGANIZER_ONLY']),
  })
  .strict();
const status = z.enum(['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']);
const answers = z.record(
  z.string(),
  z.union([
    z.string().max(10000),
    z.number().finite(),
    z.boolean(),
    z.array(z.string()).max(100),
  ])
);
const record = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  eventId: z.string(),
  personId: z.string(),
  questions: z.array(question),
  answers,
  status,
  submittedAt: z.number(),
  updatedAt: z.number(),
  decisions: z.array(
    z.object({
      status,
      actorId: z.string().optional(),
      at: z.number(),
      reason: z.string().optional(),
    })
  ),
});
const result = z.object({ applicationId: z.string(), status });
const form = z.object({
  settings: settings.nullable(),
  pending: record.nullable(),
  canApply: z.boolean(),
  canReview: z.boolean(),
});
const page = z.object({
  page: z.array(record),
  isDone: z.boolean(),
  continueCursor: z.string(),
  splitCursor: z.string().nullable().optional(),
  pageStatus: z
    .enum(['SplitRecommended', 'SplitRequired'])
    .nullable()
    .optional(),
});
const reviewPage = page.extend({
  page: z.array(
    record.extend({
      applicant: z.object({
        personId: z.string(),
        name: z.string().nullable(),
        username: z.string().nullable(),
        image: z.string().nullable(),
      }),
    })
  ),
});
const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
const errors = {
  400: {
    description: 'Invalid input',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Authentication required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Application authority or eligibility denied',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Not found',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
const applicationParams = z.object({ applicationId: z.string() });
export function createEventApplicationRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/applications/form',
      tags: ['Event Applications'],
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema },
      responses: {
        ...errors,
        200: {
          description: 'Current form and own pending request',
          content: { 'application/json': { schema: form } },
        },
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runQuery(internal.eventApplications.rest.getForm, {
          eventId: c.req.valid('param').eventId as Id<'events'>,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  for (const kind of ['history', 'list'] as const) {
    app.openapi(
      createRoute({
        method: 'get',
        path: `/events/{eventId}/applications/${kind}`,
        tags: ['Event Applications'],
        security: [{ apiKey: [] }],
        request: { params: EventIdParamSchema, query: pagination },
        responses: {
          ...errors,
          200: {
            description:
              kind === 'history'
                ? 'Own private history'
                : 'Current reviewer-only history and queue',
            content: {
              'application/json': {
                schema: kind === 'list' ? reviewPage : page,
              },
            },
          },
        },
      }),
      async c => {
        const ctx = c.get('ctx'),
          q = c.req.valid('query');
        return c.json(
          await ctx.runQuery(internal.eventApplications.rest[kind], {
            eventId: c.req.valid('param').eventId as Id<'events'>,
            personId: c.get('personId') as Id<'persons'>,
            paginationOpts: { numItems: q.limit, cursor: q.cursor ?? null },
          }),
          200
        );
      }
    );
  }
  app.openapi(
    createRoute({
      method: 'put',
      path: '/events/{eventId}/applications/settings',
      tags: ['Event Applications'],
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: { 'application/json': { schema: settings } },
        },
      },
      responses: {
        ...errors,
        200: {
          description: 'Saved application settings',
          content: { 'application/json': { schema: settings } },
        },
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runMutation(internal.eventApplications.rest.configure, {
          ...c.req.valid('json'),
          eventId: c.req.valid('param').eventId as Id<'events'>,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/applications',
      tags: ['Event Applications'],
      security: [{ apiKey: [] }],
      description:
        'Creates an application, or updates pending answers against its retained questions.',
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: {
            'application/json': { schema: z.object({ answers }).strict() },
          },
        },
      },
      responses: {
        ...errors,
        200: {
          description: 'Pending application',
          content: { 'application/json': { schema: result } },
        },
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runMutation(internal.eventApplications.rest.submit, {
          ...c.req.valid('json'),
          eventId: c.req.valid('param').eventId as Id<'events'>,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/event-applications/{applicationId}/withdraw',
      tags: ['Event Applications'],
      security: [{ apiKey: [] }],
      request: { params: applicationParams },
      responses: {
        ...errors,
        200: {
          description: 'Withdrawn application',
          content: { 'application/json': { schema: result } },
        },
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runMutation(internal.eventApplications.rest.withdraw, {
          applicationId: c.req.valid('param')
            .applicationId as Id<'eventApplications'>,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/event-applications/{applicationId}/decision',
      tags: ['Event Applications'],
      security: [{ apiKey: [] }],
      request: {
        params: applicationParams,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  decision: z.enum(['APPROVED', 'DECLINED']),
                  reason: z.string().max(2000).optional(),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        ...errors,
        200: {
          description:
            'Reviewed application; approval immediately admits Attendee/Pending',
          content: { 'application/json': { schema: result } },
        },
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runMutation(internal.eventApplications.rest.decide, {
          ...c.req.valid('json'),
          applicationId: c.req.valid('param')
            .applicationId as Id<'eventApplications'>,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  return app;
}

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
import {
  GroupPageQuerySchema,
  GroupPersonSchema,
} from '../schemas/groupInvites';
import {
  GroupApplicationQuestionSchema as question,
  GroupApplicationAnswersSchema as answers,
  GroupApplicationStatusSchema as status,
  GroupApplicationSchema as application,
  GroupApplicationFormSchema as form,
  GroupApplicationResultSchema as result,
} from '../schemas/groupApplications';
const params = z.object({ groupId: z.string().min(1).max(512) });
const applicationParams = params.extend({
  applicationId: z.string().min(1).max(512),
});
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409].map(code => [
    code,
    {
      description:
        'Invalid input, unavailable resource, conflicting transition or insufficient Group authority',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  ])
);
const ok = (schema: z.ZodType, description: string) => ({
  200: { description, content: { 'application/json': { schema } } },
  ...errors,
});
export function createGroupApplicationRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/application-form',
      tags: ['Groups'],
      summary: 'Read admission questions and your private pending application',
      security: [{ apiKey: [] }],
      request: { params },
      responses: ok(form, 'Application form'),
    }),
    async c => {
      const value = await c
        .get('ctx')
        .runQuery(internal.groupApplications.rest.form, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        });
      return c.json(value, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/groups/{groupId}/application-settings',
      tags: ['Groups'],
      summary: 'Configure Group applications as owner',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          content: {
            'application/json': {
              schema: z
                .object({
                  applicationsEnabled: z.boolean(),
                  questions: z.array(question).max(50),
                })
                .strict(),
            },
          },
        },
      },
      responses: ok(z.object({ success: z.literal(true) }), 'Saved settings'),
    }),
    async c => {
      await c
        .get('ctx')
        .runMutation(internal.groupApplications.rest.configure, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.json({ success: true as const }, 200);
    }
  );
  for (const own of [true, false] as const) {
    app.openapi(
      createRoute({
        method: 'get',
        path: own
          ? '/groups/{groupId}/applications/mine'
          : '/groups/{groupId}/applications',
        tags: ['Groups'],
        summary: own
          ? 'Read your retained private Group application history'
          : 'Review private Group application queue as manager',
        security: [{ apiKey: [] }],
        request: {
          params,
          query: own
            ? GroupPageQuerySchema
            : GroupPageQuerySchema.extend({ status: status.optional() }),
        },
        responses: ok(
          z.object({
            items: z.array(
              own
                ? application
                : application.extend({ applicant: GroupPersonSchema })
            ),
            nextCursor: z.string().nullable(),
          }),
          'Private application page'
        ),
      }),
      async c => {
        const input = c.req.valid('query');
        const args = {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          paginationOpts: {
            numItems: input.limit,
            cursor: input.cursor ?? null,
          },
        };
        const queryCtx = c.get('ctx');
        const value = own
          ? await queryCtx.runQuery(
              internal.groupApplications.rest.history,
              args
            )
          : await queryCtx.runQuery(internal.groupApplications.rest.list, {
              ...args,
              ...('status' in input && input.status
                ? { status: status.parse(input.status) }
                : {}),
            });
        return c.json(
          {
            items: value.page,
            nextCursor: value.isDone ? null : value.continueCursor,
          },
          200
        );
      }
    );
  }
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/applications',
      tags: ['Groups'],
      summary: 'Submit or edit your pending admission application',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          content: {
            'application/json': { schema: z.object({ answers }).strict() },
          },
        },
      },
      responses: ok(result, 'Pending application'),
    }),
    async c => {
      const value = await c
        .get('ctx')
        .runMutation(internal.groupApplications.rest.submit, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.json(value, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/applications/{applicationId}',
      tags: ['Groups'],
      summary: 'Read a private application as its author or current manager',
      security: [{ apiKey: [] }],
      request: { params: applicationParams },
      responses: ok(application, 'Private retained application'),
    }),
    async c => {
      const value = await c
        .get('ctx')
        .runQuery(internal.groupApplications.rest.read, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        });
      return c.json(value, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}/applications/{applicationId}',
      tags: ['Groups'],
      summary: 'Edit your pending answers against saved question definitions',
      security: [{ apiKey: [] }],
      request: {
        params: applicationParams,
        body: {
          content: {
            'application/json': { schema: z.object({ answers }).strict() },
          },
        },
      },
      responses: ok(result, 'Edited pending application'),
    }),
    async c => {
      const value = await c
        .get('ctx')
        .runMutation(internal.groupApplications.rest.edit, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.json(value, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/applications/{applicationId}/withdraw',
      tags: ['Groups'],
      summary: 'Withdraw your pending application without deleting history',
      security: [{ apiKey: [] }],
      request: { params: applicationParams },
      responses: ok(result, 'Withdrawn application'),
    }),
    async c => {
      const value = await c
        .get('ctx')
        .runMutation(internal.groupApplications.rest.withdraw, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        });
      return c.json(value, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/applications/{applicationId}/review',
      tags: ['Groups'],
      summary: 'Approve or decline an application as current Group manager',
      security: [{ apiKey: [] }],
      request: {
        params: applicationParams,
        body: {
          content: {
            'application/json': {
              schema: z
                .object({ decision: z.enum(['APPROVED', 'DECLINED']) })
                .strict(),
            },
          },
        },
      },
      responses: ok(result, 'Recorded immutable decision'),
    }),
    async c => {
      const value = await c
        .get('ctx')
        .runMutation(internal.groupApplications.rest.review, {
          actorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.json(value, 200);
    }
  );
  return app;
}

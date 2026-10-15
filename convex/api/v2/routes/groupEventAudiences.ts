import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
import { SafeEventLogisticsSchema } from '../schemas/eventLogistics';
import { GroupPageQuerySchema } from '../schemas/groupInvites';
const group = z.object({ groupId: z.string().min(1).max(512) });
const event = z.object({ eventId: z.string().min(1).max(512) });
const target = group.extend(event.shape);
const result = z.object({
  eventId: z.string(),
  groupId: z.string(),
  shared: z.boolean(),
});
const grant = z.object({
  groupId: z.string(),
  name: z.string(),
  canWithdraw: z.boolean(),
});
const audience = z.object({
  eventId: z.string(),
  friendsShared: z.boolean().nullable(),
  canManageEvent: z.boolean(),
  groups: z.array(grant),
});
const errors = Object.fromEntries(
  [400, 401, 403, 404].map(code => [
    code,
    {
      description: 'Invalid input or current authority/eligibility required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  ])
);
const ok = (schema: z.ZodType) => ({
  200: {
    description: 'Current audience state',
    content: { 'application/json': { schema } },
  },
  ...errors,
});
export function createGroupEventAudienceRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/audiences',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary:
        'Read only viewer-visible Group associations and Organizer Friends setting',
      request: { params: event },
      responses: ok(audience),
    }),
    async c => {
      const queryCtx = c.get('ctx');
      const value = await queryCtx.runQuery(
        internal.groupEventAudiences.rest.get,
        {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        }
      );
      return c.json(value, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/events/{eventId}/audiences/friends',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary: 'Set independent Friends audience as current Organizer',
      request: {
        params: event,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({ enabled: z.boolean() }).strict(),
            },
          },
        },
      },
      responses: ok(
        z.object({ eventId: z.string(), friendsShared: z.boolean() })
      ),
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.groupEventAudiences.rest.friends, {
            personId: c.get('personId') as Id<'persons'>,
            ...c.req.valid('param'),
            ...c.req.valid('json'),
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'put',
      path: '/groups/{groupId}/event-sharing',
      tags: ['Groups'],
      security: [{ apiKey: [] }],
      summary: 'Configure whole-Group Event sharing as owner',
      request: {
        params: group,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ policy: z.enum(['MANAGERS', 'MEMBERS']) })
                .strict(),
            },
          },
        },
      },
      responses: ok(z.object({ success: z.literal(true) })),
    }),
    async c => {
      await c
        .get('ctx')
        .runMutation(internal.groupEventAudiences.rest.configure, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        });
      return c.json({ success: true as const }, 200);
    }
  );
  for (const method of ['post', 'delete'] as const)
    app.openapi(
      createRoute({
        method,
        path: '/events/{eventId}/audiences/groups/{groupId}',
        tags: ['Events'],
        security: [{ apiKey: [] }],
        summary:
          method === 'post'
            ? 'Share with a whole Group with both permissions'
            : 'Withdraw one Group grant without affecting other audiences',
        request: { params: target },
        responses: ok(result),
      }),
      async c => {
        const ctx = c.get('ctx');
        const args = {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
        };
        return c.json(
          method === 'post'
            ? await ctx.runMutation(
                internal.groupEventAudiences.rest.share,
                args
              )
            : await ctx.runMutation(
                internal.groupEventAudiences.rest.withdraw,
                args
              ),
          200
        );
      }
    );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/groups/{groupId}/events/{eventId}',
      tags: ['Groups'],
      security: [{ apiKey: [] }],
      summary:
        'Withdraw this Group grant as current Group manager; conveys no Event authority',
      request: { params: target },
      responses: ok(result),
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.groupEventAudiences.rest.withdraw, {
            personId: c.get('personId') as Id<'persons'>,
            ...c.req.valid('param'),
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/events',
      tags: ['Groups'],
      security: [{ apiKey: [] }],
      summary:
        'Read safe upcoming/undated Group Event previews in bounded association-order pages',
      description:
        'Pages scan at most limit associations (1–100), omitting past or currently unreadable Events. Continue nextCursor even on an empty page. No admission, membership, invitation, RSVP or tool action is performed.',
      request: { params: group, query: GroupPageQuerySchema },
      responses: ok(
        z.object({
          items: z.array(
            z.object({
              event: SafeEventLogisticsSchema,
              canWithdraw: z.boolean(),
            })
          ),
          nextCursor: z.string().nullable(),
        })
      ),
    }),
    async c => {
      const q = c.req.valid('query');
      const value = await c
        .get('ctx')
        .runQuery(internal.groupEventAudiences.rest.list, {
          personId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('param'),
          paginationOpts: { numItems: q.limit ?? 20, cursor: q.cursor ?? null },
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
  return app;
}

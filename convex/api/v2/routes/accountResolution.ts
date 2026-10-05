import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema } from '../schemas/common';
import { createValidationHook } from '../validation';
type Variables = { ctx: ActionCtx; personId: string; userId: string };
const readiness = z.object({
  hasOwnedGroups: z.boolean(),
  hasOwnedEvents: z.boolean(),
  canDelete: z.boolean(),
});
const item = z.object({
  kind: z.enum(['GROUP', 'EVENT']),
  id: z.string(),
  title: z.string(),
  status: z.enum(['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']),
  transferId: z.string().nullable(),
  recipientId: z.string().nullable(),
  resolved: z.literal(false),
});
const errors = {
  400: {
    description: 'Invalid input',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Active API identity required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Account scope/ownership required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  409: {
    description: 'Resolve all current Groups and Events first',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createAccountResolutionRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/account/responsibilities',
      tags: ['Account'],
      summary:
        'Enumerate all current owned Groups or Events, including unresolved offers',
      security: [{ apiKey: [] }],
      request: {
        query: z
          .object({
            kind: z.enum(['GROUP', 'EVENT']),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            cursor: z.string().min(1).max(8192).optional(),
          })
          .strict(),
      },
      responses: {
        ...errors,
        200: {
          description: 'Complete indexed ownership page',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(item),
                nextCursor: z.string().nullable(),
              }),
            },
          },
        },
      },
    }),
    async c => {
      const input = c.req.valid('query');
      const result = await c
        .get('ctx')
        .runQuery(internal.accountResolution.rest.listOwned, {
          personId: c.get('personId') as Id<'persons'>,
          kind: input.kind,
          paginationOpts: {
            cursor: input.cursor ?? null,
            numItems: input.limit,
          },
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
      path: '/account/readiness',
      tags: ['Account'],
      summary: 'Read live readiness; final deletion revalidates',
      security: [{ apiKey: [] }],
      responses: {
        ...errors,
        200: {
          description: 'Live responsibility guard',
          content: { 'application/json': { schema: readiness } },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.accountResolution.rest.readiness, {
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/account/delete',
      tags: ['Account'],
      summary:
        'Permanently delete the authenticated account after live responsibility resolution',
      security: [{ apiKey: [] }],
      request: {
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ confirmation: z.string().min(1).max(512) })
                .strict(),
            },
          },
        },
      },
      responses: {
        ...errors,
        200: {
          description: 'Account and credentials deleted in one transaction',
          content: {
            'application/json': { schema: z.object({ success: z.boolean() }) },
          },
        },
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.accountResolution.rest.deleteAccount, {
            personId: c.get('personId') as Id<'persons'>,
            userId: c.get('userId'),
            ...c.req.valid('json'),
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/account/responsibilities/events/{eventId}',
      tags: ['Account'],
      summary:
        'Explicitly delete an owned Event, including legacy membership inconsistencies',
      security: [{ apiKey: [] }],
      request: { params: z.object({ eventId: z.string().min(1).max(512) }) },
      responses: {
        ...errors,
        204: { description: 'Owned Event explicitly deleted' },
      },
    }),
    async c => {
      await c
        .get('ctx')
        .runMutation(internal.accountResolution.rest.deleteOwnedEvent, {
          personId: c.get('personId') as Id<'persons'>,
          eventId: c.req.valid('param').eventId,
        });
      return c.body(null, 204);
    }
  );
  return app;
}

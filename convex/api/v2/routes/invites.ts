import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import * as schema from '../schemas/invites';
type Variables = { ctx: ActionCtx; userId: string; personId: string };
const errors = {
  400: {
    description: 'Invalid input',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Not found',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  409: {
    description: 'Invite unavailable or request conflict',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createInviteRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/invites',
      tags: ['Invites'],
      summary: 'List link and email invites',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        query: schema.InviteListQuerySchema,
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.union([
                schema.InviteListResponseSchema,
                schema.InvitePageSchema,
              ]),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { eventId } = c.req.valid('param');
      const query = c.req.valid('query');
      const result = await ctx.runQuery(internal.invites.rest.listLinks, {
        personId,
        eventId: eventId as Id<'events'>,
        kind: query.kind ?? 'all',
        limit: query.pagination === 'cursor' ? (query.limit ?? 20) : undefined,
        cursor: query.cursor,
      });
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/invites',
      tags: ['Invites'],
      summary: 'Create link invitation',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: {
            'application/json': { schema: schema.CreateInviteRequestSchema },
          },
        },
        headers: z.object({ 'idempotency-key': z.string().optional() }),
      },
      responses: {
        201: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({ id: z.string(), token: z.string() }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { eventId } = c.req.valid('param');
      const result = await ctx.runMutation(internal.invites.rest.create, {
        personId,
        userId: c.get('userId'),
        requestId: c.req.header('Idempotency-Key'),
        body: {
          ...c.req.valid('json'),
          kind: 'link',
          eventId: eventId as Id<'events'>,
        },
      });
      if (!('id' in result)) throw new Error('Unexpected invitation result');
      return c.json(result, 201);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/invites/email',
      tags: ['Invites'],
      summary: 'Create email invitation',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: {
            'application/json': { schema: schema.EmailInviteRequestSchema },
          },
        },
        headers: z.object({ 'idempotency-key': z.string().optional() }),
      },
      responses: {
        201: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({
                createdCount: z.number(),
                inviteIds: z.array(z.string()),
                queuedCount: z.number(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { eventId } = c.req.valid('param');
      const result = await ctx.runMutation(internal.invites.rest.create, {
        personId,
        userId: c.get('userId'),
        requestId: c.req.header('Idempotency-Key'),
        body: {
          ...c.req.valid('json'),
          kind: 'email',
          eventId: eventId as Id<'events'>,
        },
      });
      if (!('createdCount' in result))
        throw new Error('Unexpected invitation result');
      return c.json(result, 201);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/member-invites',
      tags: ['Invites'],
      summary: 'Create member invitation',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: {
            'application/json': { schema: schema.MemberInviteRequestSchema },
          },
        },
        headers: z.object({ 'idempotency-key': z.string().optional() }),
      },
      responses: {
        201: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({
                inviteId: z.string(),
                status: z.literal('PENDING'),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { eventId } = c.req.valid('param');
      const result = await ctx.runMutation(internal.invites.rest.create, {
        personId,
        userId: c.get('userId'),
        requestId: c.req.header('Idempotency-Key'),
        body: {
          ...c.req.valid('json'),
          kind: 'member',
          eventId: eventId as Id<'events'>,
        },
      });
      if (!('inviteId' in result))
        throw new Error('Unexpected invitation result');
      return c.json(result, 201);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/invites/send-pending',
      tags: ['Invites'],
      summary: 'Create pending invitation',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        headers: z.object({ 'idempotency-key': z.string().optional() }),
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({ queuedCount: z.number() }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { eventId } = c.req.valid('param');
      const result = await ctx.runMutation(internal.invites.rest.create, {
        personId,
        userId: c.get('userId'),
        requestId: c.req.header('Idempotency-Key'),
        body: { kind: 'pending', eventId: eventId as Id<'events'> },
      });
      if (!('queuedCount' in result))
        throw new Error('Unexpected invitation result');
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/invites/{inviteId}',
      tags: ['Invites'],
      summary: 'Edit invitation',
      security: [{ apiKey: [] }],
      request: {
        params: schema.InviteIdParamSchema,
        body: {
          required: true,
          content: {
            'application/json': { schema: schema.EditInviteRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.InviteSummarySchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { inviteId } = c.req.valid('param');
      return c.json(
        await ctx.runMutation(internal.invites.rest.editLink, {
          personId,
          inviteId: inviteId as Id<'invites'>,
          ...c.req.valid('json'),
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/invites/{inviteId}',
      tags: ['Invites'],
      summary: 'Delete invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteIdParamSchema },
      responses: { 204: { description: 'Success' }, ...errors },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { inviteId } = c.req.valid('param');
      await ctx.runMutation(internal.invites.rest.deleteLink, {
        personId,
        inviteId: inviteId as Id<'invites'>,
      });
      return c.body(null, 204);
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/invites/{token}',
      tags: ['Invites'],
      summary: 'Inspect bearer invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteTokenParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.InvitePublicResponseSchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const { token } = c.req.valid('param');
      return c.json(
        await ctx.runQuery(internal.invites.rest.inspectLink, {
          token,
          now: Date.now(),
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/invites/{token}/accept',
      tags: ['Invites'],
      summary: 'Accept bearer invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteTokenParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.AcceptInviteResponseSchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { token } = c.req.valid('param');
      return c.json(
        await ctx.runMutation(internal.invites.rest.acceptLink, {
          personId,
          token,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/member-invites',
      tags: ['Invites'],
      summary: 'List username invitations',
      security: [{ apiKey: [] }],
      request: { query: schema.MemberListQuerySchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.MemberInvitePageSchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const query = c.req.valid('query');
      return c.json(
        await ctx.runQuery(internal.invites.rest.listMembers, {
          personId,
          status: query.status ?? 'PENDING',
          limit: query.limit ?? 20,
          cursor: query.cursor,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/member-invites',
      tags: ['Invites'],
      summary: 'List username invitations',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        query: schema.MemberListQuerySchema,
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.MemberInvitePageSchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const query = c.req.valid('query');
      return c.json(
        await ctx.runQuery(internal.invites.rest.listMembers, {
          personId,
          eventId: c.req.valid('param').eventId as Id<'events'>,
          status: query.status ?? 'all',
          limit: query.limit ?? 20,
          cursor: query.cursor,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/member-invites/{inviteId}',
      tags: ['Invites'],
      summary: 'Inspect username invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.MemberInviteSummarySchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { inviteId } = c.req.valid('param');
      return c.json(
        await ctx.runQuery(internal.invites.rest.getMember, {
          personId,
          inviteId: inviteId as Id<'eventInvites'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/member-invites/{inviteId}/accept',
      tags: ['Invites'],
      summary: 'accept username invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.AcceptInviteResponseSchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { inviteId } = c.req.valid('param');
      const result = await ctx.runMutation(
        internal.invites.rest.respondMember,
        { personId, inviteId: inviteId as Id<'eventInvites'>, action: 'accept' }
      );
      if (result.membershipId === undefined)
        throw new Error('Unexpected invitation result');
      return c.json(
        { eventId: result.eventId, membershipId: result.membershipId },
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/member-invites/{inviteId}/decline',
      tags: ['Invites'],
      summary: 'decline username invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({ success: z.literal(true) }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { inviteId } = c.req.valid('param');
      const result = await ctx.runMutation(
        internal.invites.rest.respondMember,
        {
          personId,
          inviteId: inviteId as Id<'eventInvites'>,
          action: 'decline',
        }
      );
      if (result.success !== true)
        throw new Error('Unexpected invitation result');
      return c.json({ success: true as const }, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/member-invites/{inviteId}',
      tags: ['Invites'],
      summary: 'cancel username invitation',
      security: [{ apiKey: [] }],
      request: { params: schema.InviteIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({ success: z.literal(true) }),
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const { inviteId } = c.req.valid('param');
      const result = await ctx.runMutation(
        internal.invites.rest.respondMember,
        { personId, inviteId: inviteId as Id<'eventInvites'>, action: 'cancel' }
      );
      if (result.success !== true)
        throw new Error('Unexpected invitation result');
      return c.json({ success: true as const }, 200);
    }
  );
  return app;
}

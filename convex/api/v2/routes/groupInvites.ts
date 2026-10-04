import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
import {
  GroupInvitePageQuerySchema,
  GroupPageQuerySchema,
  GroupInviteSchema,
  GroupMemberSchema,
} from '../schemas/groupInvites';
const errors = {
  400: {
    description: 'Invalid input or cursor',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Authentication required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Caller or scope has no authority',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Resource unavailable',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  409: {
    description: 'Recipient unavailable or invitation already resolved',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
const groupParams = z.object({ groupId: z.string().min(1).max(512) });
export function createGroupInviteRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  for (const grouped of [false, true] as const) {
    const path = grouped ? '/groups/{groupId}/invitations' : '/group-invites';
    app.openapi(
      createRoute({
        method: 'get',
        path,
        tags: ['Groups'],
        summary: grouped
          ? 'List Group invitations as manager'
          : 'List your private Group invitations',
        security: [{ apiKey: [] }],
        request: {
          query: GroupInvitePageQuerySchema,
          ...(grouped ? { params: groupParams } : {}),
        },
        responses: {
          200: {
            description: 'Invitation page',
            content: {
              'application/json': {
                schema: z.object({
                  items: z.array(GroupInviteSchema),
                  nextCursor: z.string().nullable(),
                }),
              },
            },
          },
          ...errors,
        },
      }),
      async c => {
        const { limit, cursor, status } = c.req.valid('query');
        const result = await c
          .get('ctx')
          .runQuery(internal.groupInvites.rest.list, {
            personId: c.get('personId') as Id<'persons'>,
            paginationOpts: { numItems: limit, cursor: cursor ?? null },
            ...(status ? { status } : {}),
            ...(grouped ? { groupId: c.req.param('groupId') } : {}),
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
  }
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/members',
      tags: ['Groups'],
      summary: 'Read admitted Group roster',
      security: [{ apiKey: [] }],
      request: { params: groupParams, query: GroupPageQuerySchema },
      responses: {
        200: {
          description: 'Member page without private contacts',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(GroupMemberSchema),
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
      const result = await c
        .get('ctx')
        .runQuery(internal.groupInvites.rest.members, {
          personId: c.get('personId') as Id<'persons'>,
          groupId: c.req.valid('param').groupId,
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
      path: '/groups/{groupId}/invitations',
      tags: ['Groups'],
      summary: 'Invite an existing user as Group owner',
      security: [{ apiKey: [] }],
      request: {
        params: groupParams,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ inviteePersonId: z.string().min(1).max(512) })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Pending invitation; repeated send returns same offer',
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
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.groupInvites.rest.send, {
          personId: c.get('personId') as Id<'persons'>,
          groupId: c.req.valid('param').groupId,
          ...c.req.valid('json'),
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/groups/{groupId}/invitation-policy',
      tags: ['Groups'],
      summary: 'Configure Group invitations as owner',
      security: [{ apiKey: [] }],
      request: {
        params: groupParams,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({ invitationsEnabled: z.boolean() }).strict(),
            },
          },
        },
      },
      responses: { 204: { description: 'Updated' }, ...errors },
    }),
    async c => {
      await c.get('ctx').runMutation(internal.groupInvites.rest.policy, {
        personId: c.get('personId') as Id<'persons'>,
        groupId: c.req.valid('param').groupId,
        ...c.req.valid('json'),
      });
      return c.body(null, 204);
    }
  );
  const resolvedSchema = z.object({
    status: z.enum(['DECLINED', 'CANCELLED']),
  });
  app.openapi(
    createRoute({
      method: 'post',
      path: '/group-invites/{inviteId}/accept',
      tags: ['Groups'],
      summary: 'Accept your Group invitation',
      security: [{ apiKey: [] }],
      request: { params: z.object({ inviteId: z.string().min(1).max(512) }) },
      responses: {
        200: {
          description: 'Admitted once',
          content: {
            'application/json': {
              schema: z.object({
                groupId: z.string(),
                membershipId: z.string(),
                status: z.literal('ACCEPTED'),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.groupInvites.rest.accept, {
          personId: c.get('personId') as Id<'persons'>,
          inviteId: c.req.valid('param').inviteId,
        }),
        200
      )
  );
  for (const operation of ['decline', 'cancel'] as const)
    app.openapi(
      createRoute({
        method: 'post',
        path: `/group-invites/{inviteId}/${operation}`,
        tags: ['Groups'],
        summary:
          operation === 'decline'
            ? 'Decline your Group invitation'
            : 'Cancel a pending invitation as Group manager',
        security: [{ apiKey: [] }],
        request: { params: z.object({ inviteId: z.string().min(1).max(512) }) },
        responses: {
          200: {
            description: 'Resolved',
            content: { 'application/json': { schema: resolvedSchema } },
          },
          ...errors,
        },
      }),
      async c =>
        c.json(
          await c
            .get('ctx')
            .runMutation(internal.groupInvites.rest[operation], {
              personId: c.get('personId') as Id<'persons'>,
              inviteId: c.req.valid('param').inviteId,
            }),
          200
        )
    );
  return app;
}

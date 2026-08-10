import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { requireEventMembership } from '../middleware/auth';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import {
  InviteListResponseSchema,
  InvitePublicResponseSchema,
  AcceptInviteResponseSchema,
  CreateInviteRequestSchema,
  InviteIdParamSchema,
  InviteTokenParamSchema,
} from '../schemas/invites';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createInviteRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /events/:eventId/invites - List event invites
  const listInvitesRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/invites',
    tags: ['Invites'],
    summary: 'List event invites',
    description: 'Get all invites for an event (requires membership)',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'List of invites',
        content: {
          'application/json': {
            schema: InviteListResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listInvitesRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    // Verify membership
    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.invites.listEventInvites;
    const result = await ctx.runQuery(listFn, { eventId });

    return c.json(result.invites, 200);
  });

  // POST /events/:eventId/invites - Create invite
  const createInviteRoute = createRoute({
    method: 'post',
    path: '/events/{eventId}/invites',
    tags: ['Invites'],
    summary: 'Create invite',
    description: 'Create a new invite link for an event (requires membership)',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: CreateInviteRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Invite created',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string(),
              token: z.string(),
            }),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(createInviteRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');
    const body = c.req.valid('json');

    // Verify membership and get membershipId
    const membership = await requireEventMembership(ctx, eventId, personId);

    const expiresAt = body.expiresAt
      ? new Date(body.expiresAt).getTime()
      : undefined;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const createFn = internal.api.v1.internal.invites.createInvite;
    const result = await ctx.runMutation(createFn, {
      eventId,
      creatorMembershipId: membership.membershipId,
      maxUses: body.maxUses,
      name: body.name,
      expiresAt,
    });

    return c.json(
      {
        id: result.id,
        token: result.token,
      },
      201
    );
  });

  // DELETE /invites/:inviteId - Delete invite
  const deleteInviteRoute = createRoute({
    method: 'delete',
    path: '/invites/{inviteId}',
    tags: ['Invites'],
    summary: 'Delete invite',
    description: 'Delete an invite link',
    security: [{ apiKey: [] }],
    request: {
      params: InviteIdParamSchema,
    },
    responses: {
      204: {
        description: 'Invite deleted successfully',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Invite not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteInviteRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { inviteId } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const deleteFn = internal.api.v1.internal.invites.deleteInvite;
      await ctx.runMutation(deleteFn, { inviteId, personId });

      return c.body(null, 204);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete invite';
      return c.json(
        {
          error: { code: 'NOT_FOUND', message },
        },
        404
      );
    }
  });

  // GET /invites/:token - Get invite by token (public)
  const getInviteByTokenRoute = createRoute({
    method: 'get',
    path: '/invites/{token}',
    tags: ['Invites'],
    summary: 'Get invite by token',
    description: 'Get public invite information by token (no auth required)',
    request: {
      params: InviteTokenParamSchema,
    },
    responses: {
      200: {
        description: 'Invite details',
        content: {
          'application/json': {
            schema: InvitePublicResponseSchema,
          },
        },
      },
      404: {
        description: 'Invite not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(getInviteByTokenRoute, async c => {
    const ctx = c.get('ctx');
    const { token } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.invites.getInviteByToken;
    const result = await ctx.runQuery(getFn, { token });

    if (!result) {
      return c.json(
        {
          error: { code: 'NOT_FOUND', message: 'Invite not found' },
        },
        404
      );
    }

    return c.json(result, 200);
  });

  // POST /invites/:token/accept - Accept invite
  const acceptInviteRoute = createRoute({
    method: 'post',
    path: '/invites/{token}/accept',
    tags: ['Invites'],
    summary: 'Accept invite',
    description: 'Accept an invite and join the event',
    security: [{ apiKey: [] }],
    request: {
      params: InviteTokenParamSchema,
    },
    responses: {
      200: {
        description: 'Invite accepted',
        content: {
          'application/json': {
            schema: AcceptInviteResponseSchema,
          },
        },
      },
      400: {
        description:
          'Bad request - invite expired, max uses reached, or already a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Invite not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(acceptInviteRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { token } = c.req.valid('param');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const acceptFn = internal.api.v1.internal.invites.acceptInvite;
      const result = await ctx.runMutation(acceptFn, { token, personId });

      return c.json(
        {
          eventId: result.eventId,
          membershipId: result.membershipId,
        },
        200
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to accept invite';

      if (message === 'Invite not found') {
        return c.json(
          {
            error: { code: 'NOT_FOUND', message },
          },
          404
        );
      }

      return c.json(
        {
          error: { code: 'BAD_REQUEST', message },
        },
        400
      );
    }
  });

  return app;
}

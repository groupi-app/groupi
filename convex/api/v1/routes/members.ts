import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { requireEventMembership, requireEventRole } from '../middleware/auth';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import {
  MemberListResponseSchema,
  MemberUpdateResponseSchema,
  RsvpUpdateResponseSchema,
  LeaveEventResponseSchema,
  RemoveMemberResponseSchema,
  UpdateMemberRoleRequestSchema,
  UpdateRsvpRequestSchema,
} from '../schemas/members';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createMemberRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /events/:eventId/members - List event members
  const listMembersRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/members',
    tags: ['Members'],
    summary: 'List members',
    description: 'Get all members of an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'List of members',
        content: {
          'application/json': {
            schema: MemberListResponseSchema,
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

  app.openapi(listMembersRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.members.listEventMembers;
    const result = await ctx.runQuery(listFn, { eventId });

    return c.json(
      {
        success: true as const,
        data: result.members,
      },
      200
    );
  });

  // PATCH /events/:eventId/members/:memberId - Update member role
  const updateMemberRoleRoute = createRoute({
    method: 'patch',
    path: '/events/{eventId}/members/{memberId}',
    tags: ['Members'],
    summary: 'Update member role',
    description: "Update a member's role (requires MODERATOR role or higher)",
    security: [{ apiKey: [] }],
    request: {
      params: z.object({
        eventId: z.string(),
        memberId: z.string(),
      }),
      body: {
        content: {
          'application/json': {
            schema: UpdateMemberRoleRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Member role updated',
        content: {
          'application/json': {
            schema: MemberUpdateResponseSchema,
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
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Member not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(updateMemberRoleRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, memberId } = c.req.valid('param');
    const body = c.req.valid('json');

    await requireEventRole(ctx, eventId, personId, 'MODERATOR');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateRoleFn = internal.api.v1.internal.members.updateMemberRole;
    const result = await ctx.runMutation(updateRoleFn, {
      membershipId: memberId,
      newRole: body.role,
    });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // DELETE /events/:eventId/members/:memberId - Remove member
  const removeMemberRoute = createRoute({
    method: 'delete',
    path: '/events/{eventId}/members/{memberId}',
    tags: ['Members'],
    summary: 'Remove member',
    description:
      'Remove a member from an event (requires MODERATOR role or higher)',
    security: [{ apiKey: [] }],
    request: {
      params: z.object({
        eventId: z.string(),
        memberId: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Member removed',
        content: {
          'application/json': {
            schema: RemoveMemberResponseSchema,
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
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Member not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(removeMemberRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, memberId } = c.req.valid('param');

    await requireEventRole(ctx, eventId, personId, 'MODERATOR');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const removeFn = internal.api.v1.internal.members.removeMember;
    await ctx.runMutation(removeFn, { membershipId: memberId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Member removed successfully' },
      },
      200
    );
  });

  // POST /events/:eventId/leave - Leave event
  const leaveEventRoute = createRoute({
    method: 'post',
    path: '/events/{eventId}/leave',
    tags: ['Members'],
    summary: 'Leave event',
    description: 'Leave an event (remove yourself from membership)',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'Left event successfully',
        content: {
          'application/json': {
            schema: LeaveEventResponseSchema,
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
        description: 'Forbidden - cannot leave as last organizer',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(leaveEventRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const leaveFn = internal.api.v1.internal.members.leaveEvent;
    await ctx.runMutation(leaveFn, { eventId, personId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Left event successfully' },
      },
      200
    );
  });

  // PATCH /events/:eventId/rsvp - Update RSVP
  const updateRsvpRoute = createRoute({
    method: 'patch',
    path: '/events/{eventId}/rsvp',
    tags: ['Members'],
    summary: 'Update RSVP',
    description: 'Update your RSVP status for an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateRsvpRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'RSVP updated',
        content: {
          'application/json': {
            schema: RsvpUpdateResponseSchema,
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

  app.openapi(updateRsvpRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateRsvpFn = internal.api.v1.internal.members.updateRsvp;
    const result = await ctx.runMutation(updateRsvpFn, {
      eventId,
      personId,
      rsvpStatus: body.rsvpStatus,
    });

    return c.json(
      {
        success: true as const,
        data: {
          membershipId: result.membershipId,
          rsvpStatus: result.rsvpStatus,
        },
      },
      200
    );
  });

  return app;
}

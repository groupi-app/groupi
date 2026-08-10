import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import {
  ErrorResponseSchema,
  EventIdParamSchema,
  MessageResponseSchema,
} from '../schemas/common';
import {
  AdminUserListResponseSchema,
  AdminEventListResponseSchema,
  AdminReportListResponseSchema,
  SetUserRoleRequestSchema,
  UserIdParamSchema,
} from '../schemas/admin';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

/**
 * Helper to verify admin status and return 403 if not admin
 */
async function verifyAdmin(ctx: ActionCtx, userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep (TS2589)
  const isAdminFn = internal.api.v1.internal.admin.isAdmin;
  return await ctx.runQuery(isAdminFn, { userId });
}

export function createAdminRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /admin/users - List all users
  const listUsersRoute = createRoute({
    method: 'get',
    path: '/admin/users',
    tags: ['Admin'],
    summary: 'List all users',
    description: 'List all users in the system (admin only)',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of users',
        content: {
          'application/json': {
            schema: AdminUserListResponseSchema,
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
        description: 'Forbidden - admin required',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listUsersRoute, async c => {
    const ctx = c.get('ctx');
    const userId = c.get('userId');

    const admin = await verifyAdmin(ctx, userId);
    if (!admin) {
      return c.json(
        {
          error: { code: 'FORBIDDEN', message: 'Admin privileges required' },
        },
        403
      );
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.admin.listUsers;
    const result = await ctx.runQuery(listFn, {});

    return c.json(result.users, 200);
  });

  // DELETE /admin/users/:userId - Delete user
  const deleteUserRoute = createRoute({
    method: 'delete',
    path: '/admin/users/{userId}',
    tags: ['Admin'],
    summary: 'Delete user',
    description: 'Delete a user and their associated data (admin only)',
    security: [{ apiKey: [] }],
    request: {
      params: UserIdParamSchema,
    },
    responses: {
      204: {
        description: 'User deleted successfully',
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
        description: 'Forbidden - admin required',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteUserRoute, async c => {
    const ctx = c.get('ctx');
    const currentUserId = c.get('userId');
    const { userId } = c.req.valid('param');

    const admin = await verifyAdmin(ctx, currentUserId);
    if (!admin) {
      return c.json(
        {
          error: { code: 'FORBIDDEN', message: 'Admin privileges required' },
        },
        403
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const deleteFn = internal.api.v1.internal.admin.deleteUser;
      await ctx.runMutation(deleteFn, { userId });

      return c.body(null, 204);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete user';
      return c.json(
        {
          error: { code: 'NOT_FOUND', message },
        },
        404
      );
    }
  });

  // PUT /admin/users/:userId/role - Set user role
  const setUserRoleRoute = createRoute({
    method: 'put',
    path: '/admin/users/{userId}/role',
    tags: ['Admin'],
    summary: 'Set user role',
    description: "Update a user's role (admin only)",
    security: [{ apiKey: [] }],
    request: {
      params: UserIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: SetUserRoleRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Role updated',
        content: {
          'application/json': {
            schema: MessageResponseSchema,
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
        description: 'Forbidden - admin required',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(setUserRoleRoute, async c => {
    const ctx = c.get('ctx');
    const currentUserId = c.get('userId');
    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');

    const admin = await verifyAdmin(ctx, currentUserId);
    if (!admin) {
      return c.json(
        {
          error: { code: 'FORBIDDEN', message: 'Admin privileges required' },
        },
        403
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const setRoleFn = internal.api.v1.internal.admin.setUserRole;
      await ctx.runMutation(setRoleFn, { userId, role: body.role });

      return c.json({ message: `User role updated to ${body.role}` }, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update role';
      return c.json(
        {
          error: { code: 'NOT_FOUND', message },
        },
        404
      );
    }
  });

  // GET /admin/events - List all events
  const listEventsRoute = createRoute({
    method: 'get',
    path: '/admin/events',
    tags: ['Admin'],
    summary: 'List all events',
    description: 'List all events in the system (admin only)',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of events',
        content: {
          'application/json': {
            schema: AdminEventListResponseSchema,
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
        description: 'Forbidden - admin required',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listEventsRoute, async c => {
    const ctx = c.get('ctx');
    const userId = c.get('userId');

    const admin = await verifyAdmin(ctx, userId);
    if (!admin) {
      return c.json(
        {
          error: { code: 'FORBIDDEN', message: 'Admin privileges required' },
        },
        403
      );
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.admin.listAllEvents;
    const result = await ctx.runQuery(listFn, {});

    return c.json(result.events, 200);
  });

  // DELETE /admin/events/:eventId - Delete event
  const deleteEventRoute = createRoute({
    method: 'delete',
    path: '/admin/events/{eventId}',
    tags: ['Admin'],
    summary: 'Delete event (admin)',
    description: 'Delete an event as admin (admin only)',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      204: {
        description: 'Event deleted successfully',
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
        description: 'Forbidden - admin required',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Event not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteEventRoute, async c => {
    const ctx = c.get('ctx');
    const userId = c.get('userId');
    const { eventId } = c.req.valid('param');

    const admin = await verifyAdmin(ctx, userId);
    if (!admin) {
      return c.json(
        {
          error: { code: 'FORBIDDEN', message: 'Admin privileges required' },
        },
        403
      );
    }

    try {
      // Reuse the existing event delete internal function
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const deleteFn = internal.api.v1.internal.events.deleteEvent;
      await ctx.runMutation(deleteFn, { eventId });

      return c.body(null, 204);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete event';
      return c.json(
        {
          error: { code: 'NOT_FOUND', message },
        },
        404
      );
    }
  });

  // GET /admin/reports - List all reports
  const listReportsRoute = createRoute({
    method: 'get',
    path: '/admin/reports',
    tags: ['Admin'],
    summary: 'List all reports',
    description: 'List all content reports (admin only)',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of reports',
        content: {
          'application/json': {
            schema: AdminReportListResponseSchema,
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
        description: 'Forbidden - admin required',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listReportsRoute, async c => {
    const ctx = c.get('ctx');
    const userId = c.get('userId');

    const admin = await verifyAdmin(ctx, userId);
    if (!admin) {
      return c.json(
        {
          error: { code: 'FORBIDDEN', message: 'Admin privileges required' },
        },
        403
      );
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.admin.listReportsAdmin;
    const result = await ctx.runQuery(listFn, {});

    return c.json(result.reports, 200);
  });

  return app;
}

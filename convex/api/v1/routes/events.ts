import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { requireEventMembership, requireEventRole } from '../middleware/auth';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import {
  EventListResponseSchema,
  EventResponseSchema,
  EventCreateResponseSchema,
  CreateEventRequestSchema,
  UpdateEventRequestSchema,
} from '../schemas/events';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createEventRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /events - List user's events
  const listEventsRoute = createRoute({
    method: 'get',
    path: '/events',
    tags: ['Events'],
    summary: 'List events',
    description: 'Get all events the authenticated user is a member of',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of events',
        content: {
          'application/json': {
            schema: EventListResponseSchema,
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
    },
  });

  app.openapi(listEventsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // Get user's events via internal query
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.events.listUserEvents;
    const result = await ctx.runQuery(listFn, { personId });

    return c.json(
      {
        success: true as const,
        data: result.events,
      },
      200
    );
  });

  // POST /events - Create event
  const createEventRoute = createRoute({
    method: 'post',
    path: '/events',
    tags: ['Events'],
    summary: 'Create event',
    description: 'Create a new event',
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateEventRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Event created',
        content: {
          'application/json': {
            schema: EventCreateResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request',
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
    },
  });

  app.openapi(createEventRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const createFn = internal.api.v1.internal.events.createEvent;
    const result = await ctx.runMutation(createFn, { personId, ...body });

    return c.json(
      {
        success: true as const,
        data: {
          eventId: result.eventId,
          membershipId: result.membershipId,
        },
      },
      201
    );
  });

  // GET /events/:eventId - Get event details
  const getEventRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}',
    tags: ['Events'],
    summary: 'Get event',
    description: 'Get details of a specific event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'Event details',
        content: {
          'application/json': {
            schema: EventResponseSchema,
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

  app.openapi(getEventRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    // Verify membership
    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.events.getEventDetail;
    const result = await ctx.runQuery(getFn, { eventId });

    if (!result) {
      return c.json(
        {
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Event not found' },
        },
        404
      );
    }

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // PATCH /events/:eventId - Update event
  const updateEventRoute = createRoute({
    method: 'patch',
    path: '/events/{eventId}',
    tags: ['Events'],
    summary: 'Update event',
    description: 'Update an event (requires MODERATOR role or higher)',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateEventRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Event updated',
        content: {
          'application/json': {
            schema: EventResponseSchema,
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
        description: 'Event not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(updateEventRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');
    const body = c.req.valid('json');

    // Require moderator role
    await requireEventRole(ctx, eventId, personId, 'MODERATOR');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateFn = internal.api.v1.internal.events.updateEvent;
    const result = await ctx.runMutation(updateFn, { eventId, ...body });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // DELETE /events/:eventId - Delete event
  const deleteEventRoute = createRoute({
    method: 'delete',
    path: '/events/{eventId}',
    tags: ['Events'],
    summary: 'Delete event',
    description: 'Delete an event (requires ORGANIZER role)',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'Event deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ message: z.string() }),
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
        description: 'Forbidden - must be organizer',
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
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    // Require organizer role
    await requireEventRole(ctx, eventId, personId, 'ORGANIZER');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const deleteFn = internal.api.v1.internal.events.deleteEvent;
    await ctx.runMutation(deleteFn, { eventId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Event deleted successfully' },
      },
      200
    );
  });

  return app;
}

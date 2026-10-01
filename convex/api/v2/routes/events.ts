import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import {
  requireEventMembership,
  requireEventRole,
} from '../../v1/middleware/auth';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import {
  EventListResponseSchema,
  EventPageResponseSchema,
  EventListQuerySchema,
  EventResponseSchema,
  EventCreateResponseSchema,
  CreateEventRequestSchema,
  UpdateEventRequestSchema,
} from '../schemas/events';
import type { Id } from '../../../_generated/dataModel';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createEventRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });

  // GET /events - List user's events
  const listEventsRoute = createRoute({
    method: 'get',
    path: '/events',
    tags: ['Events'],
    summary: 'List events',
    description:
      'Get member events. Without pagination returns the legacy array. Set pagination=cursor for bounded membership-order pages (default 20, maximum 100); continue until nextCursor is null, including after an empty page.',
    request: { query: EventListQuerySchema },
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of events',
        content: {
          'application/json': {
            schema: z.union([EventListResponseSchema, EventPageResponseSchema]),
          },
        },
      },
      400: {
        description: 'Invalid pagination',
        content: { 'application/json': { schema: ErrorResponseSchema } },
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
    const query = c.req.valid('query');
    if (query.pagination === 'cursor') {
      const result = await ctx.runQuery(
        internal.api.v1.internal.events.listUserEventsPage,
        {
          personId:
            personId as import('../../../_generated/dataModel').Id<'persons'>,
          limit: query.limit ?? 20,
          cursor: query.cursor ?? null,
        }
      );
      if ('error' in result)
        return c.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid event cursor. Start again without a cursor.',
            },
          },
          400
        );
      return c.json(result, 200);
    }

    // Get user's events via internal query
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.events.listUserEvents;
    const result = await ctx.runQuery(listFn, { personId });

    return c.json(result.events, 200);
  });

  // POST /events - Create event
  const createEventRoute = createRoute({
    method: 'post',
    path: '/events',
    tags: ['Events'],
    summary: 'Create event',
    description:
      'Create an event. Optional Idempotency-Key (<unix-ms>.<uuid-v4>) provides atomic replay for 24 hours from its timestamp. Reuse returns the original IDs; changed payload or expired key returns 409. Keys over five minutes in the future are rejected. Without a key creation is not replay-safe. Dates require explicit offsets and are stored as UTC instants.',
    security: [{ apiKey: [] }],
    request: {
      headers: z.object({ 'Idempotency-Key': z.string().optional() }),
      body: {
        content: {
          'application/json': {
            schema: CreateEventRequestSchema,
          },
        },
      },
    },
    responses: {
      409: {
        description: 'Request identifier conflict or expiry',
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
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
    const result = await c.get('ctx').runMutation(internal.events.rest.create, {
      personId: c.get('personId') as Id<'persons'>,
      userId: c.get('userId'),
      requestId: c.req.header('Idempotency-Key'),
      body: c.req.valid('json'),
    });
    return c.json(result, 201);
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
          error: { code: 'NOT_FOUND', message: 'Event not found' },
        },
        404
      );
    }

    return c.json(result, 200);
  });

  // PATCH /events/:eventId - Update event
  const updateEventRoute = createRoute({
    method: 'patch',
    path: '/events/{eventId}',
    tags: ['Events'],
    summary: 'Update event',
    description:
      'Edit basic fields as moderator/organizer, or replace proposed date options as organizer. Replacement deletes previous votes and notifies members. PATCH is not replay-safe. Confirmed dates must be reset before replacing proposed dates. The legacy reminderOffset field updates the reminders add-on; other add-on configuration uses separate operations.',
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
      409: {
        description:
          'Confirmed date must be reset before replacing poll options',
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
      400: {
        description: 'Invalid event fields',
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
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

    const result = await ctx.runMutation(internal.events.rest.update, {
      personId: personId as Id<'persons'>,
      eventId: eventId as Id<'events'>,
      body,
    });

    return c.json(result, 200);
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
    const deleteFn = internal.events.managementRest.removeEvent;
    await ctx.runMutation(deleteFn, {
      eventId: eventId as Id<'events'>,
      personId: personId as Id<'persons'>,
    });

    return c.body(null, 204);
  });

  return app;
}

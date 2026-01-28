import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { requireEventMembership } from '../middleware/auth';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import {
  AvailabilityGridResponseSchema,
  SubmitAvailabilityRequestSchema,
  SubmitAvailabilityResponseSchema,
  PotentialDatesResponseSchema,
} from '../schemas/availability';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createAvailabilityRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /events/:eventId/availability - Get availability grid
  const getAvailabilityRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/availability',
    tags: ['Availability'],
    summary: 'Get availability grid',
    description: 'Get the availability voting grid for an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'Availability grid',
        content: {
          'application/json': {
            schema: AvailabilityGridResponseSchema,
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

  app.openapi(getAvailabilityRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    const membership = await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getGridFn = internal.api.v1.internal.availability.getAvailabilityGrid;
    const result = await ctx.runQuery(getGridFn, { eventId });

    return c.json(
      {
        success: true as const,
        data: {
          eventId,
          potentialDates: result.potentialDates,
          userMembershipId: membership.membershipId,
        },
      },
      200
    );
  });

  // POST /events/:eventId/availability - Submit availability
  const submitAvailabilityRoute = createRoute({
    method: 'post',
    path: '/events/{eventId}/availability',
    tags: ['Availability'],
    summary: 'Submit availability',
    description: 'Submit or update availability for potential dates',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: SubmitAvailabilityRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Availability submitted',
        content: {
          'application/json': {
            schema: SubmitAvailabilityResponseSchema,
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

  app.openapi(submitAvailabilityRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');
    const body = c.req.valid('json');

    const membership = await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const submitFn = internal.api.v1.internal.availability.submitAvailability;
    const result = await ctx.runMutation(submitFn, {
      membershipId: membership.membershipId,
      responses: body.responses,
    });

    return c.json(
      {
        success: true as const,
        data: {
          updated: result.updated,
          created: result.created,
        },
      },
      200
    );
  });

  // GET /events/:eventId/potential-dates - List potential dates
  const getPotentialDatesRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/potential-dates',
    tags: ['Availability'],
    summary: 'Get potential dates',
    description: 'Get the list of potential date options for an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'List of potential dates',
        content: {
          'application/json': {
            schema: PotentialDatesResponseSchema,
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

  app.openapi(getPotentialDatesRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getDatesFn = internal.api.v1.internal.availability.getPotentialDates;
    const result = await ctx.runQuery(getDatesFn, { eventId });

    return c.json(
      {
        success: true as const,
        data: result.potentialDates,
      },
      200
    );
  });

  return app;
}

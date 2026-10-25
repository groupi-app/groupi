import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import { EventListQuerySchema, EventResponseSchema } from '../schemas/events';
import { RsvpUpdateResponseSchema } from '../schemas/members';
import * as schema from '../schemas/availability';
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
};
export function createAvailabilityRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/rsvp',
      tags: ['Availability'],
      summary: 'Read your RSVP',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: { 'application/json': { schema: RsvpUpdateResponseSchema } },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      return c.json(
        await ctx.runQuery(internal.availability.rest.getRsvp, {
          eventId,
          personId,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/availability',
      tags: ['Availability'],
      summary: 'Read availability grid',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: schema.AvailabilityGridResponseSchema,
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      return c.json(
        await ctx.runQuery(internal.availability.rest.grid, {
          eventId,
          personId,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/availability',
      tags: ['Availability'],
      summary: 'Submit availability',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: schema.SubmitAvailabilityRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: schema.SubmitAvailabilityResponseSchema,
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      const input = c.req.valid('json');
      return c.json(
        await ctx.runMutation(internal.availability.rest.submit, {
          eventId,
          personId,
          responses: input.responses.map(response => ({
            ...response,
            potentialDateTimeId:
              response.potentialDateTimeId as Id<'potentialDateTimes'>,
          })),
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/events/{eventId}/availability',
      tags: ['Availability'],
      summary: 'Clear your availability',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({
                deletedCount: z.number(),
                membershipId: z.string(),
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
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      return c.json(
        await ctx.runMutation(internal.availability.rest.clear, {
          eventId,
          personId,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/potential-dates',
      tags: ['Availability'],
      summary: 'List potential dates',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema, query: EventListQuerySchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.union([
                schema.PotentialDatesResponseSchema,
                schema.PotentialDatesPageSchema,
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
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      const query = c.req.valid('query');
      return c.json(
        await ctx.runQuery(internal.availability.rest.dates, {
          eventId,
          personId,
          limit:
            query.pagination === 'cursor' ? (query.limit ?? 20) : undefined,
          cursor: query.cursor,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/availability/mine',
      tags: ['Availability'],
      summary: 'Read your availability',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema, query: EventListQuerySchema },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: schema.OwnAvailabilityPageSchema },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      const query = c.req.valid('query');
      return c.json(
        await ctx.runQuery(internal.availability.rest.mine, {
          eventId,
          personId,
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
      path: '/events/{eventId}/availability/responses',
      tags: ['Availability'],
      summary: 'List availability responses',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        query: EventListQuerySchema.safeExtend({
          potentialDateTimeId: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: schema.AvailabilityResponsesPageSchema,
            },
          },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      const query = c.req.valid('query');
      return c.json(
        await ctx.runQuery(internal.availability.rest.responses, {
          eventId,
          personId,
          limit: query.limit ?? 20,
          cursor: query.cursor,
          potentialDateTimeId:
            query.potentialDateTimeId as Id<'potentialDateTimes'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/date',
      tags: ['Availability'],
      summary: 'Choose event date',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          required: true,
          content: { 'application/json': { schema: schema.ChooseDateSchema } },
        },
      },
      responses: {
        200: {
          description: 'Success',
          content: { 'application/json': { schema: EventResponseSchema } },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      const input = c.req.valid('json');
      const selection =
        input.selectionSource === 'POLL'
          ? {
              selectionSource: input.selectionSource,
              potentialDateTimeId:
                input.potentialDateTimeId as Id<'potentialDateTimes'>,
            }
          : input;
      return c.json(
        await ctx.runMutation(internal.availability.rest.chooseDate, {
          eventId,
          personId,
          selection,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/events/{eventId}/date',
      tags: ['Availability'],
      summary: 'Reset event date',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema },
      responses: {
        200: {
          description: 'Success',
          content: { 'application/json': { schema: EventResponseSchema } },
        },
        ...errors,
      },
    }),
    async c => {
      const ctx = c.get('ctx');
      const personId = c.get('personId') as Id<'persons'>;
      const eventId = c.req.valid('param').eventId as Id<'events'>;
      return c.json(
        await ctx.runMutation(internal.availability.rest.resetDate, {
          eventId,
          personId,
        }),
        200
      );
    }
  );
  return app;
}

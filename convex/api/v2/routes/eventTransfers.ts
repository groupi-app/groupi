import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
type Variables = { ctx: ActionCtx; userId: string; personId: string };
const transfer = z
  .object({
    eventId: z.string(),
    organizerId: z.string(),
    createdById: z.string(),
    transferId: z.string().nullable(),
    offeredById: z.string().nullable(),
    recipientId: z.string().nullable(),
    status: z.enum(['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']),
    explanation: z.string(),
  })
  .nullable();
const responses = {
  200: {
    description: 'Current ownership and transfer status; pending is unresolved',
    content: { 'application/json': { schema: transfer } },
  },
  403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  409: {
    description: 'Offer no longer available',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createEventTransferRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/ownership-transfer',
      tags: ['Events'],
      summary: 'Inspect consensual ownership transfer',
      security: [{ apiKey: [] }],
      request: { params: EventIdParamSchema },
      responses,
    }),
    async c => {
      return c.json(
        await c.get('ctx').runQuery(internal.eventTransfers.rest.status, {
          eventId: c.req.valid('param').eventId as Id<'events'>,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/ownership-transfer',
      tags: ['Events'],
      summary: 'Offer ownership to an eligible existing member',
      description:
        'Responsibility changes only on acceptance. Friends visibility then follows the new Organizer.',
      security: [{ apiKey: [] }],
      request: {
        params: EventIdParamSchema,
        body: {
          content: {
            'application/json': {
              schema: z.object({ recipientId: z.string() }).strict(),
            },
          },
        },
      },
      responses,
    }),
    async c => {
      return c.json(
        await c.get('ctx').runMutation(internal.eventTransfers.rest.offer, {
          eventId: c.req.valid('param').eventId as Id<'events'>,
          personId: c.get('personId') as Id<'persons'>,
          recipientId: c.req.valid('json').recipientId as Id<'persons'>,
        }),
        200
      );
    }
  );
  for (const action of ['accept', 'decline', 'cancel'] as const) {
    app.openapi(
      createRoute({
        method: 'post',
        path: `/events/{eventId}/ownership-transfer/${action}`,
        tags: ['Events'],
        summary: `${action} the named ownership offer`,
        security: [{ apiKey: [] }],
        request: {
          params: EventIdParamSchema,
          body: {
            content: {
              'application/json': {
                schema: z.object({ transferId: z.string() }).strict(),
              },
            },
          },
        },
        responses,
      }),
      async c => {
        return c.json(
          await c.get('ctx').runMutation(internal.eventTransfers.rest.decide, {
            eventId: c.req.valid('param').eventId as Id<'events'>,
            personId: c.get('personId') as Id<'persons'>,
            transferId: c.req.valid('json').transferId as Id<'eventTransfers'>,
            decision:
              action === 'accept'
                ? 'ACCEPTED'
                : action === 'decline'
                  ? 'DECLINED'
                  : 'CANCELLED',
          }),
          200
        );
      }
    );
  }
  return app;
}

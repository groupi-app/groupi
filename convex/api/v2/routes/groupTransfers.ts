import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
type Variables = { ctx: ActionCtx; personId: string; userId: string };
const identity = z.object({
  personId: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  image: z.string().nullable(),
});
const transfer = z
  .object({
    groupId: z.string(),
    ownerId: z.string(),
    transferId: z.string().nullable(),
    offeredById: z.string().nullable(),
    recipientId: z.string().nullable(),
    recipient: identity.nullable(),
    status: z.enum(['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']),
    explanation: z.string(),
    canOffer: z.boolean(),
    canAccept: z.boolean(),
    canDecline: z.boolean(),
    canCancel: z.boolean(),
  })
  .nullable();
const params = z.object({ groupId: z.string().min(1).max(512) });
const responses = {
  200: {
    description:
      'Consensual transfer status; pending ownership remains unresolved',
    content: { 'application/json': { schema: transfer } },
  },
  400: {
    description: 'Invalid input',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Active account required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Current owner/recipient authority required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Offer unavailable',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  409: {
    description: 'Stale or unresolved offer',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createGroupTransferRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/ownership-transfer',
      tags: ['Groups'],
      summary: 'Read private participant ownership offer status',
      security: [{ apiKey: [] }],
      request: { params },
      responses,
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runQuery(internal.groupTransfers.rest.status, {
          groupId: c.req.valid('param').groupId,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/ownership-transfer',
      tags: ['Groups'],
      summary: 'Offer Group responsibility to an admitted member',
      description:
        'The current owner remains responsible until acceptance. Independent Events are unaffected.',
      security: [{ apiKey: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ recipientId: z.string().min(1).max(512) })
                .strict(),
            },
          },
        },
      },
      responses,
    }),
    async c => {
      const ctx = c.get('ctx');
      return c.json(
        await ctx.runMutation(internal.groupTransfers.rest.offer, {
          groupId: c.req.valid('param').groupId,
          personId: c.get('personId') as Id<'persons'>,
          recipientId: c.req.valid('json').recipientId,
        }),
        200
      );
    }
  );
  for (const action of ['accept', 'decline', 'cancel'] as const)
    app.openapi(
      createRoute({
        method: 'post',
        path: `/groups/{groupId}/ownership-transfer/${action}`,
        tags: ['Groups'],
        summary: `${action} the observed ownership offer`,
        security: [{ apiKey: [] }],
        request: {
          params,
          body: {
            required: true,
            content: {
              'application/json': {
                schema: z
                  .object({ transferId: z.string().min(1).max(512) })
                  .strict(),
              },
            },
          },
        },
        responses,
      }),
      async c => {
        const ctx = c.get('ctx');
        return c.json(
          await ctx.runMutation(internal.groupTransfers.rest.decide, {
            groupId: c.req.valid('param').groupId,
            personId: c.get('personId') as Id<'persons'>,
            transferId: c.req.valid('json').transferId,
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
  return app;
}

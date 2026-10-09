import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
const result = z.object({
  announcementId: z.string(),
  state: z.enum(['PROCESSING', 'COMPLETED', 'CANCELLED']),
  notified: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
const params = z.object({ groupId: z.string().min(1).max(512) });
const errors = Object.fromEntries(
  [400, 401, 403, 404, 409].map(status => [
    status,
    {
      description: 'Invalid request or current manager authority required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  ])
);
export function createGroupAnnouncementRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>({ defaultHook: createValidationHook() });
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/announcements',
      tags: ['Groups'],
      summary: 'Explicitly announce to permitted Group members',
      security: [{ apiKey: [] }],
      request: {
        params,
        headers: z.object({ 'idempotency-key': z.string().min(1).max(100) }),
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  title: z.string().trim().min(1).max(100),
                  message: z.string().trim().min(1).max(2000),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        202: {
          description:
            'Created notifications or queued processing; not delivery confirmation',
          content: { 'application/json': { schema: result } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.groupAnnouncements.rest.create, {
            personId: c.get('personId') as Id<'persons'>,
            groupId: c.req.valid('param').groupId,
            requestId: c.req.valid('header')['idempotency-key'],
            ...c.req.valid('json'),
          }),
        202
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/announcements/status',
      tags: ['Groups'],
      summary: 'Recover your explicit announcement request status',
      security: [{ apiKey: [] }],
      request: {
        params,
        query: z.object({ requestId: z.string().min(1).max(100) }),
      },
      responses: {
        200: {
          description: 'Aggregate status; no contacts or private preferences',
          content: { 'application/json': { schema: result.nullable() } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.groupAnnouncements.rest.status, {
          personId: c.get('personId') as Id<'persons'>,
          groupId: c.req.valid('param').groupId,
          requestId: c.req.valid('query').requestId,
        }),
        200
      )
  );
  return app;
}

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { ErrorResponseSchema } from '../schemas/common';
const status = z.object({
  mode: z.enum(['role', 'membership']),
  guildName: z.string(),
  guildIconUrl: z.string().url().optional(),
  openUrl: z.string().url(),
  linked: z.boolean(),
  linkedDiscordUserId: z.string().optional(),
  eligible: z.boolean(),
  status: z.enum([
    'not_connected',
    'pending',
    'screening',
    'connected',
    'blocked',
  ]),
  error: z.string().optional(),
  externalException: z.string().optional(),
  lastObservedAt: z.number().optional(),
  observationError: z.string().optional(),
  cleanupPending: z.boolean().optional(),
});
export function createGroupDiscordRoutes() {
  const app = new OpenAPIHono();
  const params = z.object({ groupId: z.string().min(1).max(512) });
  const errors = {
    403: {
      description: 'Selected Group scope and current member authority required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Delegated authentication required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  };
  app.openapi(
    createRoute({
      method: 'get',
      path: '/groups/{groupId}/discord',
      operationId: 'readOwnGroupDiscordStatus',
      tags: ['Groups'],
      summary:
        'Read own selected Group Discord access and Open Discord destination',
      security: [{ boundedBearer: [] }],
      request: { params },
      responses: {
        200: {
          description:
            'Own status; no Discord credentials or configuration authority',
          content: { 'application/json': { schema: status.nullable() } },
        },
        ...errors,
      },
    }),
    async () => {
      throw new HTTPException(403);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/groups/{groupId}/discord/connect',
      operationId: 'beginOwnGroupDiscordConnect',
      tags: ['Groups'],
      summary: 'Begin a Groupi-hosted member identity and consent journey',
      security: [{ boundedBearer: [] }],
      request: {
        params,
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({ returnUrl: z.string().url().max(2048) })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'Short-lived hosted URL; initiation does not grant Discord access',
          content: {
            'application/json': {
              schema: z.object({
                url: z.string().url(),
                expiresAt: z.number(),
              }),
            },
          },
        },
        ...errors,
      },
    }),
    async () => {
      throw new HTTPException(403);
    }
  );
  return app;
}

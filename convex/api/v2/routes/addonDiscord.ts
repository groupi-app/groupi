import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { internal } from '../../../_generated/api';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';

type Variables = { ctx: ActionCtx; personId: string; userId: string };
export function createAddonDiscordRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  const page = z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(['available', 'invitable']),
        authorizedAt: z.number(),
        expiresAt: z.number(),
      })
    ),
    nextCursor: z.string().nullable(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/discord/guilds',
      tags: ['Add-ons'],
      summary: 'List cached authorized Discord guilds for this identity',
      security: [{ apiKey: [] }],
      request: {
        query: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20),
          cursor: z.string().min(1).optional(),
        }),
      },
      responses: {
        200: {
          description:
            'Cached authorizations (refresh before configuring after expiry)',
          content: { 'application/json': { schema: page } },
        },
      },
    }),
    async c => {
      const query = c.req.valid('query');
      const result = await c
        .get('ctx')
        .runQuery(internal.discord.cli.listGuilds, {
          personId: c.get('personId') as Id<'persons'>,
          userId: c.get('userId'),
          limit: query.limit,
          cursor: query.cursor ?? null,
        });
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/discord/guilds/refresh',
      tags: ['Add-ons'],
      summary: 'Refresh this identity’s Discord guild authorization cache',
      description:
        'Checks linked OAuth credentials and MANAGE_GUILD plus bot presence. Does not change events. Linking a missing Discord account requires the app browser flow.',
      security: [{ apiKey: [] }],
      responses: {
        200: {
          description: 'Replaced authorizations',
          content: {
            'application/json': {
              schema: z.object({
                count: z.number(),
                authorizedAt: z.number(),
                expiresAt: z.number(),
              }),
            },
          },
        },
        409: {
          description: 'Discord account must be linked',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        503: {
          description: 'Discord authorization or service unavailable',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    }),
    async c => {
      const result = await c
        .get('ctx')
        .runAction(internal.discord.cli.refreshGuilds, {
          personId: c.get('personId') as Id<'persons'>,
          userId: c.get('userId'),
        });
      if ('error' in result)
        return c.json(
          {
            error: {
              code: result.error,
              message:
                result.error === 'DISCORD_NOT_LINKED'
                  ? 'Link Discord to this identity in the app, then refresh guilds from the CLI.'
                  : 'Discord authorization could not be refreshed. Check the linked account and Discord service, then try again.',
            },
          },
          result.error === 'DISCORD_NOT_LINKED' ? 409 : 503
        );
      return c.json(result, 200);
    }
  );
  return app;
}

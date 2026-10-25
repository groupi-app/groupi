import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { internal } from '../../../_generated/api';
import type { ActionCtx } from '../../../_generated/server';

const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
const json = (schema: z.ZodType) => ({
  content: { 'application/json': { schema } },
  description: 'CLI authorization response',
});

export function createCliAuthRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: unknown; userId: string; personId: string };
  }>({
    defaultHook: (result, c) => {
      if (!result.success)
        return c.json(
          {
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid CLI authorization exchange request.',
            },
          },
          400
        );
    },
  });
  app.use('/auth/cli/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(
    createRoute({
      method: 'post',
      path: '/auth/cli/exchange',
      tags: ['Authentication'],
      request: {
        body: {
          required: true,
          content: {
            'application/json': {
              schema: z
                .object({
                  code: token,
                  verifier: token,
                  state: token,
                  callbackPort: z.number().int().min(1).max(65535),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        200: json(
          z.object({
            apiKey: z.string(),
            expiresAt: z.number(),
            account: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
            }),
          })
        ),
        400: json(errorSchema),
        401: json(errorSchema),
      },
    }),
    async c => {
      const ctx = c.get('ctx') as ActionCtx;
      const result = await ctx.runMutation(
        internal.cliAuth.mutations.exchange,
        c.req.valid('json')
      );
      if (!result)
        return c.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message:
                'CLI authorization is invalid or expired. Start login again.',
            },
          },
          401
        );
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/auth/cli/revoke',
      tags: ['Authentication'],
      security: [{ apiKey: [] }],
      responses: { 200: json(z.object({ revoked: z.literal(true) })) },
    }),
    async c => {
      const ctx = c.get('ctx') as ActionCtx;
      await ctx.runMutation(internal.cliAuth.mutations.revoke, {
        apiKey: c.req.header('x-api-key') ?? '',
        userId: c.get('userId'),
      });
      return c.json({ revoked: true }, 200);
    }
  );
  return app;
}

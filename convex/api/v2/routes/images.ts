import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
type Variables = { ctx: ActionCtx; personId: string; userId: string };
const focal = z
  .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
  .strict();
const image = z.object({
  storageId: z.string().nullable(),
  imageUrl: z.string().nullable(),
  focalPoint: focal.nullable(),
});
const errorResponses = {
  400: {
    description: 'Invalid image, upload, or focal point',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Image or event is not owned or manageable by this identity',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Image or target not found',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createImageRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  for (const cover of [false, true]) {
    const path = cover ? '/events/{eventId}/cover' : '/profile/avatar';
    for (const method of ['get', 'put', 'delete'] as const) {
      const route = createRoute({
        path,
        method,
        tags: [cover ? 'Events' : 'Profile'],
        security: [{ apiKey: [] }],
        summary: `${method === 'get' ? 'Inspect' : method === 'put' ? 'Replace' : 'Remove'} ${cover ? 'event cover' : 'current account avatar'}`,
        description:
          'Upload with POST /uploads using the corresponding cover/avatar purpose before PUT. Images are image-only and at most 10 MiB. PUT claims an owned unclaimed upload atomically. Failed claims preserve the current image; owned orphan uploads are discarded. Writes are not automatically replayed; inspect this endpoint after uncertain outcomes.',
        request: {
          ...(cover
            ? { params: z.object({ eventId: z.string().min(1) }) }
            : {}),
          ...(method === 'put'
            ? {
                body: {
                  content: {
                    'application/json': {
                      schema: cover
                        ? z
                            .object({
                              storageId: z.string().min(1),
                              focalPoint: focal.nullable().optional(),
                            })
                            .strict()
                        : z.object({ storageId: z.string().min(1) }).strict(),
                    },
                  },
                },
              }
            : {}),
        },
        responses: {
          ...errorResponses,
          200: {
            description: 'Current image',
            content: { 'application/json': { schema: image } },
          },
        },
      });
      app.openapi(route, async c => {
        const ctx = c.get('ctx');
        const actor = {
          personId: c.get('personId') as Id<'persons'>,
          userId: c.get('userId'),
          ...(cover ? { eventId: c.req.param('eventId') as Id<'events'> } : {}),
        };
        if (method === 'get')
          return c.json(
            await ctx.runQuery(internal.files.images.get, actor),
            200
          );
        const body =
          method === 'put'
            ? ((await c.req.json()) as {
                storageId: string;
                focalPoint?: { x: number; y: number } | null;
              })
            : undefined;
        try {
          return c.json(
            await ctx.runMutation(internal.files.images.set, {
              ...actor,
              storageId: (body?.storageId as Id<'_storage'>) ?? null,
              ...(body && 'focalPoint' in body
                ? { focalPoint: body.focalPoint }
                : {}),
            }),
            200
          );
        } catch (error) {
          // Discard only unclaimed uploads owned by this actor. A racing successful
          // claim is protected, so cleanup never breaks an accepted image.
          if (body?.storageId) {
            try {
              await ctx.runMutation(internal.files.uploads.discardUpload, {
                personId: actor.personId,
                storageId: body.storageId as Id<'_storage'>,
              });
            } catch {
              /* Expiry cleanup remains available if discard fails. */
            }
          }
          throw error;
        }
      });
    }
  }
  return app;
}

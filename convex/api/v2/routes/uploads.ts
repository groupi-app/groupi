import { readUploadBlob } from '../../../files/uploads';
import { validateImageBytes } from '../../../files/imageRules';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { HTTPException } from 'hono/http-exception';
const uploaded = z.object({
  storageId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
});
const details = uploaded.extend({ url: z.string().url().nullable() });
const uploadParams = z.object({ storageId: z.string() });
type UploadInput = {
  in: { param: z.input<typeof uploadParams> };
  out: { param: z.output<typeof uploadParams> };
};
export function createUploadRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>();
  app.openapi(
    createRoute({
      method: 'post',
      path: '/uploads',
      tags: ['Files'],
      summary: 'Upload a file',
      description:
        'Upload 1 byte to 10 MiB. Bounded credentials require eventId and files.upload; only attachment purpose is supported. Raw upload bodies preserve their Content-Type. Returned storageId is bound to that principal and event.',
      security: [{ apiKey: [] }, { boundedBearer: [] }],
      request: {
        query: z.object({
          purpose: z.enum(['attachment', 'avatar', 'cover']).optional(),
          eventId: z.string().optional(),
        }),
        headers: z.object({
          'X-Filename': z.string().min(1).max(255).optional(),
        }),
        body: {
          required: true,
          content: {
            'application/octet-stream': {
              schema: z.string().openapi({ format: 'binary' }),
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Uploaded file descriptor',
          content: { 'application/json': { schema: uploaded } },
        },
      },
    }),
    async c => {
      const purpose = c.req.query('purpose') ?? 'attachment';
      if (!['attachment', 'avatar', 'cover'].includes(purpose))
        throw new HTTPException(400, { message: 'Invalid upload purpose' });
      const blob = await readUploadBlob(c.req.raw);
      if (blob.size === 0 || blob.size > 10 * 1024 * 1024)
        throw new HTTPException(400, {
          message: 'Upload must contain 1 byte to 10 MiB',
        });
      if (purpose === 'cover' || purpose === 'avatar')
        validateImageBytes(
          purpose,
          blob.type,
          new Uint8Array(await blob.arrayBuffer())
        );
      const ctx = c.get('ctx');
      const storageId = await ctx.storage.store(blob);
      try {
        await ctx.runMutation(internal.files.uploads.registerUpload, {
          storageId,
          personId: c.get('personId') as Id<'persons'>,
          purpose: purpose as 'attachment' | 'avatar' | 'cover',
          mimeType: blob.type,
          size: blob.size,
        });
      } catch (error) {
        await ctx.storage.delete(storageId);
        throw error;
      }
      return c.json(
        {
          storageId,
          filename: c.req.header('X-Filename') ?? 'upload',
          mimeType: blob.type,
          size: blob.size,
        },
        201
      );
    }
  );
  const readRoute = createRoute({
    method: 'get',
    path: '/uploads/{storageId}',
    tags: ['Files'],
    summary: 'Read an accessible file descriptor',
    description:
      'Requires access to the attachment parent event or ownership of an unclaimed upload. Bounded credentials additionally require files.read for that event. Already acquired storage URLs cannot be retroactively revoked.',
    security: [{ apiKey: [] }, { boundedBearer: [] }],
    request: { params: uploadParams },
    responses: {
      200: {
        description: 'Authorized file URL',
        content: { 'application/json': { schema: details } },
      },
    },
  });
  app.openapi<typeof readRoute, UploadInput>(readRoute, async c =>
    c.json(
      await c.get('ctx').runQuery(internal.files.uploads.readRegisteredUpload, {
        storageId: c.req.valid('param').storageId as Id<'_storage'>,
        personId: c.get('personId') as Id<'persons'>,
      }),
      200
    )
  );
  const discardRoute = createRoute({
    method: 'delete',
    path: '/uploads/{storageId}',
    tags: ['Files'],
    summary: 'Discard your unclaimed upload',
    security: [{ apiKey: [] }, { boundedBearer: [] }],
    request: { params: uploadParams },
    responses: { 204: { description: 'Upload discarded' } },
  });
  app.openapi<typeof discardRoute, UploadInput>(discardRoute, async c => {
    await c.get('ctx').runMutation(internal.files.uploads.discardUpload, {
      storageId: c.req.valid('param').storageId as Id<'_storage'>,
      personId: c.get('personId') as Id<'persons'>,
    });
    return c.body(null, 204);
  });
  return app;
}

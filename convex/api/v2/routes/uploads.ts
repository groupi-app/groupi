import { readUploadBlob } from '../../../files/uploads';
import { validateImageBytes } from '../../../files/imageRules';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { HTTPException } from 'hono/http-exception';
export function createUploadRoutes() {
  const app = new OpenAPIHono<{
    Variables: { ctx: ActionCtx; personId: string; userId: string };
  }>();
  app.post('/uploads', async c => {
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
  });
  app.delete('/uploads/:storageId', async c => {
    await c.get('ctx').runMutation(internal.files.uploads.discardUpload, {
      storageId: c.req.param('storageId') as Id<'_storage'>,
      personId: c.get('personId') as Id<'persons'>,
    });
    return c.body(null, 204);
  });
  return app;
}

import { validateImageBytes } from './imageRules';
import {
  internalMutation,
  httpAction,
  type MutationCtx,
} from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
export const purposeValidator = v.union(
  v.literal('attachment'),
  v.literal('avatar'),
  v.literal('cover')
);
export type UploadPurpose = 'attachment' | 'avatar' | 'cover';
export async function claimUpload(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  storageId: Id<'_storage'>,
  purpose: UploadPurpose
) {
  const upload = await ctx.db
    .query('uploads')
    .withIndex('by_storage', q => q.eq('storageId', storageId))
    .unique();
  if (
    !upload ||
    upload.personId !== personId ||
    upload.claimed ||
    upload.purpose !== purpose ||
    upload.createdAt < Date.now() - 86400000
  )
    throw new ConvexError({
      code: 'FORBIDDEN',
      message:
        'Upload must be your unclaimed, unexpired upload for this purpose.',
    });
  await ctx.db.patch(upload._id, { claimed: true });
  return upload;
}
export const registerUpload = internalMutation({
  args: {
    storageId: v.id('_storage'),
    personId: v.id('persons'),
    purpose: purposeValidator,
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('uploads', {
      ...args,
      claimed: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      86400000,
      internal.files.uploads.expireUpload,
      { storageId: args.storageId }
    );
    return null;
  },
});
export const expireUpload = internalMutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    const row = await ctx.db
      .query('uploads')
      .withIndex('by_storage', q => q.eq('storageId', storageId))
      .unique();
    if (row && !row.claimed) {
      await ctx.storage.delete(storageId);
      await ctx.db.delete(row._id);
    }
    return null;
  },
});
export async function cleanupUnclaimed(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  storageId: Id<'_storage'>
) {
  const row = await ctx.db
    .query('uploads')
    .withIndex('by_storage', q => q.eq('storageId', storageId))
    .unique();
  if (!row) return null;
  if (row.personId !== personId || row.claimed)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only your unclaimed uploads can be discarded.',
    });
  await ctx.storage.delete(storageId);
  await ctx.db.delete(row._id);
  return null;
}
export const discardUpload = internalMutation({
  args: { storageId: v.id('_storage'), personId: v.id('persons') },
  handler: (ctx, args) => cleanupUnclaimed(ctx, args.personId, args.storageId),
});
export const consumeTicket = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query('uploadTickets')
      .withIndex('by_token', q => q.eq('token', token))
      .unique();
    if (!row || row.expiresAt < Date.now())
      throw new Error('Upload authorization expired');
    await ctx.db.delete(row._id);
    return { personId: row.personId, purpose: row.purpose };
  },
});
// App upload URLs are single-use authenticated tickets; callers cannot register arbitrary storage IDs.
export const appUpload = httpAction(async (ctx, request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  let storageId: Id<'_storage'> | undefined;
  try {
    const identity = await ctx.runMutation(
      internal.files.uploads.consumeTicket,
      { token: new URL(request.url).searchParams.get('token') ?? '' }
    );
    const blob = await readUploadBlob(request);
    if (blob.size > 10 * 1024 * 1024)
      throw new Error('Maximum upload size is 10 MiB');
    if (identity.purpose !== 'attachment')
      validateImageBytes(
        identity.purpose,
        blob.type,
        new Uint8Array(await blob.arrayBuffer())
      );
    storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.files.uploads.registerUpload, {
      storageId,
      ...identity,
      mimeType: blob.type,
      size: blob.size,
    });
    return new Response(JSON.stringify({ storageId }), { headers });
  } catch {
    if (storageId) await ctx.storage.delete(storageId);
    return new Response(
      JSON.stringify({ error: 'Upload rejected; request a fresh upload URL.' }),
      { status: 400, headers }
    );
  }
});
/** Bound bytes while reading, including chunked requests without Content-Length. */
export async function readUploadBlob(request: Request) {
  const max = 10 * 1024 * 1024;
  const advertised = Number(request.headers.get('Content-Length') ?? 0);
  if (advertised > max)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Upload exceeds 10 MiB',
    });
  const reader = request.body?.getReader();
  if (!reader)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Upload body required',
    });
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Upload exceeds 10 MiB',
        });
      chunks.push(new Uint8Array(value));
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  if (size === 0)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Empty uploads are not supported',
    });
  return new Blob(
    chunks as unknown as ConstructorParameters<typeof Blob>[0],
    {
      type: request.headers.get('Content-Type') ?? 'application/octet-stream',
    } as ConstructorParameters<typeof Blob>[1]
  );
}
export const expireTicket = internalMutation({
  args: { id: v.id('uploadTickets') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});

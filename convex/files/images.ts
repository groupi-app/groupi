import { ConvexError, v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from '../_generated/server';
import { components } from '../_generated/api';
import { authComponent, type AuthUserId } from '../auth';
import { eventViewer } from '../events/attendance';
import { requireWriteRole, updateEventForPerson } from '../events/writes';
import { claimUpload } from './uploads';
import { validateImageMetadata } from './imageRules';

const actor = { personId: v.id('persons'), userId: v.string() };
const focalPoint = v.object({ x: v.number(), y: v.number() });
const result = v.object({
  storageId: v.union(v.id('_storage'), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  focalPoint: v.union(focalPoint, v.null()),
});
const args = { ...actor, eventId: v.optional(v.id('events')) };

export const get = internalQuery({
  args,
  returns: result,
  handler: async (ctx, { personId, userId, eventId }) => {
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Account identity mismatch.',
      });
    if (eventId) {
      const { event } = await eventViewer(ctx, eventId, personId);
      return {
        storageId: event.imageStorageId ?? null,
        imageUrl: event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null,
        focalPoint: event.imageFocalPoint ?? null,
      };
    }
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    return {
      storageId:
        (user?.imageStorageId as
          | import('../_generated/dataModel').Id<'_storage'>
          | undefined) ?? null,
      imageUrl: user?.image ?? null,
      focalPoint: null,
    };
  },
});

export const set = internalMutation({
  args: {
    ...args,
    storageId: v.union(v.string(), v.null()),
    focalPoint: v.optional(v.union(focalPoint, v.null())),
  },
  returns: result,
  handler: async (
    ctx,
    { personId, userId, eventId, storageId: rawStorageId, focalPoint }
  ) => {
    const storageId =
      rawStorageId === null
        ? null
        : ctx.db.system.normalizeId('_storage', rawStorageId);
    if (rawStorageId !== null && !storageId)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Provide a valid uploaded image ID.',
      });
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Account identity mismatch.',
      });
    if (eventId) await requireWriteRole(ctx, eventId, personId, 'MODERATOR');
    if (
      focalPoint &&
      (!eventId ||
        !storageId ||
        !Number.isFinite(focalPoint.x) ||
        !Number.isFinite(focalPoint.y) ||
        focalPoint.x < 0 ||
        focalPoint.x > 1 ||
        focalPoint.y < 0 ||
        focalPoint.y > 1)
    )
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Cover focal point requires an image and x/y between 0 and 1.',
      });
    if (storageId && !eventId) {
      const metadata = await ctx.db.system.get(storageId);
      if (!metadata)
        throw new ConvexError({
          code: 'NOT_FOUND',
          message: 'Uploaded image not found.',
        });
      const upload = await claimUpload(ctx, personId, storageId, 'avatar');
      validateImageMetadata('avatar', upload.mimeType, metadata.size);
      if (
        metadata.size !== upload.size ||
        (metadata.contentType && metadata.contentType !== upload.mimeType)
      )
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Avatar metadata does not match the uploaded image.',
        });
    }
    const imageUrl = storageId ? await ctx.storage.getUrl(storageId) : null;
    if (eventId) {
      await updateEventForPerson(ctx, personId, {
        eventId,
        imageStorageId: storageId,
        imageFocalPoint: storageId ? (focalPoint ?? null) : null,
      });
      return {
        storageId,
        imageUrl,
        focalPoint: storageId ? (focalPoint ?? null) : null,
      };
    }
    await saveAvatarForUser(ctx, userId, storageId, imageUrl);
    return { storageId, imageUrl, focalPoint: null };
  },
});

/** Used by app and REST mutations; errors roll back both auth and storage. */
export async function saveAvatarForUser(
  ctx: MutationCtx,
  userId: string,
  storageId: import('../_generated/dataModel').Id<'_storage'> | null,
  imageUrl: string | null
) {
  const current = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
  if (!current)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Account not found.' });
  await ctx.runMutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: userId }],
      update: {
        image: imageUrl,
        imageStorageId: storageId,
        updatedAt: Date.now(),
      },
    },
  });
  // Delete tracked storage only; external OAuth images belong to the provider.
  if (current.imageStorageId && current.imageStorageId !== storageId) {
    const previous =
      current.imageStorageId as import('../_generated/dataModel').Id<'_storage'>;
    if (previous) await ctx.storage.delete(previous);
  }
}

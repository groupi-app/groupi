import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * File storage mutations for Convex
 *
 * Convex file storage flow:
 * 1. Client calls generateUploadUrl to get a presigned URL
 * 2. Client uploads file directly to that URL
 * 3. Client calls saveFile with the returned storageId
 * 4. File is now stored and accessible via getUrl
 */

/**
 * Generate a presigned URL for uploading a file
 * Returns URL that client can POST file data to
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    // Require authentication
    await requireAuth(ctx);

    // Generate upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a URL to access a stored file
 */
export const getFileUrl = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});

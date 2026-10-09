import { internal } from '../_generated/api';
import { purposeValidator, cleanupUnclaimed } from './uploads';
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
  args: { purpose: v.optional(purposeValidator) },
  handler: async (ctx, args) => {
    // Require authentication
    const { person } = await requireAuth(ctx);
    const token = crypto.randomUUID();
    const ticketId = await ctx.db.insert('uploadTickets', {
      token,
      purpose: args.purpose ?? 'attachment',
      personId: person._id,
      expiresAt: Date.now() + 600000,
    });
    await ctx.scheduler.runAfter(600000, internal.files.uploads.expireTicket, {
      id: ticketId,
    });
    return `${process.env.CONVEX_SITE_URL}/api/uploads/app?token=${token}`;
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
    const { person } = await requireAuth(ctx);
    const row = await ctx.db
      .query('uploads')
      .withIndex('by_storage', q => q.eq('storageId', args.storageId))
      .unique();
    if (!row || row.personId !== person._id)
      throw new Error('File belongs to another account');
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
    const { person } = await requireAuth(ctx);
    await cleanupUnclaimed(ctx, person._id, args.storageId);
    return { success: true };
  },
});

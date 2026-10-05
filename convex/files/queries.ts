import { requireAuth } from '../auth';
import { requireAttachmentParentAccess } from '../attachments/model';
import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * File storage queries for Convex
 */

/**
 * Get a URL to access a stored file
 * Returns null if file doesn't exist
 */
export const getFileUrl = query({
  args: {
    storageId: v.id('_storage'),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const attachment = await ctx.db
      .query('attachments')
      .withIndex('by_storage', q => q.eq('storageId', args.storageId))
      .first();
    if (attachment) {
      const { person } = await requireAuth(ctx);
      await requireAttachmentParentAccess(ctx, attachment, person._id, false);
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});

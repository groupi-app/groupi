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
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Attachment queries for Convex
 */

/**
 * Get all attachments for a post
 */
export const getPostAttachments = query({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_post', q => q.eq('postId', args.postId))
      .collect();

    // Get URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async attachment => {
        const url = await ctx.storage.getUrl(attachment.storageId);
        return {
          ...attachment,
          url,
        };
      })
    );

    return attachmentsWithUrls;
  },
});

/**
 * Get all attachments for a reply
 */
export const getReplyAttachments = query({
  args: {
    replyId: v.id('replies'),
  },
  handler: async (ctx, args) => {
    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_reply', q => q.eq('replyId', args.replyId))
      .collect();

    // Get URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async attachment => {
        const url = await ctx.storage.getUrl(attachment.storageId);
        return {
          ...attachment,
          url,
        };
      })
    );

    return attachmentsWithUrls;
  },
});

/**
 * Get a single attachment by ID with its URL
 */
export const getAttachment = query({
  args: {
    attachmentId: v.id('attachments'),
  },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      return null;
    }

    const url = await ctx.storage.getUrl(attachment.storageId);
    return {
      ...attachment,
      url,
    };
  },
});

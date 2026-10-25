import { requireAuth } from '../auth';
import {
  requireAttachmentParentAccess,
  attachmentWithUrlValidator,
} from './model';
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
  returns: v.array(attachmentWithUrlValidator),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    await requireAttachmentParentAccess(
      ctx,
      { postId: args.postId },
      person._id,
      false
    );
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
  returns: v.array(attachmentWithUrlValidator),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    await requireAttachmentParentAccess(
      ctx,
      { replyId: args.replyId },
      person._id,
      false
    );
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
  returns: v.union(attachmentWithUrlValidator, v.null()),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      return null;
    }

    await requireAttachmentParentAccess(ctx, attachment, person._id, false);

    const url = await ctx.storage.getUrl(attachment.storageId);
    return {
      ...attachment,
      url,
    };
  },
});

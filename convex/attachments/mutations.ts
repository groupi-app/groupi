import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import {
  attachmentInputValidator,
  createAttachmentsForParent,
  requireAttachmentParentAccess,
} from './model';

export { ALLOWED_MIME_TYPES, MAX_ATTACHMENTS, MAX_FILE_SIZE } from './model';

/**
 * Attachment mutations for Convex
 *
 * File limits:
 * - Max file size: 10MB
 * - Max attachments per post/reply: 10
 */

/**
 * Create an attachment record after file upload
 */
export const createAttachment = mutation({
  args: {
    storageId: v.id('_storage'),
    filename: v.string(),
    size: v.number(),
    mimeType: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    isSpoiler: v.optional(v.boolean()),
    altText: v.optional(v.string()),
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const [attachmentId] = await createAttachmentsForParent(ctx, {
      attachments: [args],
      postId: args.postId,
      replyId: args.replyId,
      personId: person._id,
    });
    if (!attachmentId) throw new Error('Attachment could not be created');

    return { attachmentId };
  },
});

/**
 * Update an attachment's metadata (filename, alt text, spoiler status)
 */
export const updateAttachment = mutation({
  args: {
    attachmentId: v.id('attachments'),
    filename: v.optional(v.string()),
    altText: v.optional(v.string()),
    isSpoiler: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Only the uploader can update the attachment
    if (attachment.uploaderId !== person._id) {
      throw new Error('You can only update your own attachments');
    }

    await requireAttachmentParentAccess(ctx, attachment, person._id, false);

    // Build update object
    const updates: {
      filename?: string;
      altText?: string;
      isSpoiler?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.filename !== undefined) {
      updates.filename = args.filename;
    }
    if (args.altText !== undefined) {
      updates.altText = args.altText;
    }
    if (args.isSpoiler !== undefined) {
      updates.isSpoiler = args.isSpoiler;
    }

    await ctx.db.patch(args.attachmentId, updates);

    return { success: true };
  },
});

/**
 * Delete an attachment
 */
export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id('attachments'),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Only the uploader can delete the attachment (or moderators - could add later)
    if (attachment.uploaderId !== person._id) {
      throw new Error('You can only delete your own attachments');
    }

    await requireAttachmentParentAccess(ctx, attachment, person._id, false);

    const otherAttachment = await ctx.db
      .query('attachments')
      .withIndex('by_storage', q => q.eq('storageId', attachment.storageId))
      .filter(q => q.neq(q.field('_id'), args.attachmentId))
      .first();

    // Delete the record
    await ctx.db.delete(args.attachmentId);

    // Legacy data may contain multiple attachment rows for one blob. Only
    // delete the underlying file once the final reference is removed.
    if (!otherAttachment) {
      await ctx.storage.delete(attachment.storageId);
    }

    return { success: true };
  },
});

/**
 * Create attachments in batch (for creating post/reply with attachments)
 * This is used when we need to create multiple attachments at once
 */
export const createAttachmentsBatch = mutation({
  args: {
    attachments: v.array(attachmentInputValidator),
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const attachmentIds = await createAttachmentsForParent(ctx, {
      ...args,
      personId: person._id,
    });

    return { attachmentIds };
  },
});

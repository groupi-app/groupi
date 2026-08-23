import { mutation, type MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';

/**
 * Attachment mutations for Convex
 *
 * File limits:
 * - Max file size: 10MB
 * - Max attachments per post/reply: 10
 */

// File size limit: 10MB in bytes
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Max attachments per post/reply
export const MAX_ATTACHMENTS = 10;

// Allowed MIME types by category
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  FILE: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
  ],
};

/**
 * Determine attachment type from MIME type
 */
function getAttachmentType(
  mimeType: string
): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' {
  if (ALLOWED_MIME_TYPES.IMAGE.includes(mimeType)) return 'IMAGE';
  if (ALLOWED_MIME_TYPES.VIDEO.includes(mimeType)) return 'VIDEO';
  if (ALLOWED_MIME_TYPES.AUDIO.includes(mimeType)) return 'AUDIO';
  return 'FILE';
}

/**
 * Check if MIME type is allowed
 */
function isAllowedMimeType(mimeType: string): boolean {
  return Object.values(ALLOWED_MIME_TYPES).flat().includes(mimeType);
}

type AttachmentParent = {
  postId?: Id<'posts'>;
  replyId?: Id<'replies'>;
};

/**
 * Resolve an attachment parent and enforce the event isolation boundary.
 * New attachments may only be registered by the parent author; this prevents
 * a member from attaching their uploaded file to another member's content.
 */
async function requireAttachmentParentAccess(
  ctx: MutationCtx,
  parent: AttachmentParent,
  personId: Id<'persons'>,
  requireParentAuthor: boolean
) {
  if (
    (parent.postId && parent.replyId) ||
    (!parent.postId && !parent.replyId)
  ) {
    throw new Error('Exactly one of postId or replyId must be specified');
  }

  if (parent.postId) {
    const post = await ctx.db.get(parent.postId);
    if (!post) {
      throw new Error('Attachment parent not found');
    }

    await requireEventRole(ctx, post.eventId, 'ATTENDEE');
    if (requireParentAuthor && post.authorId !== personId) {
      throw new Error('You can only attach files to your own content');
    }

    return;
  }

  const reply = await ctx.db.get(parent.replyId!);
  if (!reply) {
    throw new Error('Attachment parent not found');
  }

  const post = await ctx.db.get(reply.postId);
  if (!post) {
    throw new Error('Attachment parent not found');
  }

  await requireEventRole(ctx, post.eventId, 'ATTENDEE');
  if (requireParentAuthor && reply.authorId !== personId) {
    throw new Error('You can only attach files to your own content');
  }
}

/**
 * Convex does not currently persist who generated an upload URL, so strict
 * storage ownership cannot be proven after upload. Validate everything the
 * storage metadata does expose: existence, byte size, and content type.
 */
async function requireValidStoredFile(
  ctx: MutationCtx,
  storageId: Id<'_storage'>,
  declaredSize: number,
  declaredMimeType: string
) {
  const storedFile = await ctx.db.system.get('_storage', storageId);
  if (!storedFile) {
    throw new Error('Uploaded file not found');
  }

  if (storedFile.size !== declaredSize) {
    throw new Error('Uploaded file size does not match');
  }

  if (storedFile.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  if (storedFile.contentType && storedFile.contentType !== declaredMimeType) {
    throw new Error('Uploaded file type does not match');
  }

  const effectiveMimeType = storedFile.contentType || declaredMimeType;
  if (!isAllowedMimeType(effectiveMimeType)) {
    throw new Error(`File type ${effectiveMimeType} is not allowed`);
  }
}

async function requireUnclaimedStorage(
  ctx: MutationCtx,
  storageId: Id<'_storage'>
) {
  const existingAttachment = await ctx.db
    .query('attachments')
    .withIndex('by_storage', q => q.eq('storageId', storageId))
    .first();

  if (existingAttachment) {
    throw new Error('Uploaded file is already attached');
  }
}

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

    await requireAttachmentParentAccess(ctx, args, person._id, true);
    await requireValidStoredFile(ctx, args.storageId, args.size, args.mimeType);
    await requireUnclaimedStorage(ctx, args.storageId);

    // Validate file size
    if (args.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validate MIME type
    if (!isAllowedMimeType(args.mimeType)) {
      throw new Error(`File type ${args.mimeType} is not allowed`);
    }

    // Check attachment count limit
    if (args.postId) {
      const existingCount = await ctx.db
        .query('attachments')
        .withIndex('by_post', q => q.eq('postId', args.postId))
        .collect();
      if (existingCount.length >= MAX_ATTACHMENTS) {
        throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments per post`);
      }
    } else if (args.replyId) {
      const existingCount = await ctx.db
        .query('attachments')
        .withIndex('by_reply', q => q.eq('replyId', args.replyId))
        .collect();
      if (existingCount.length >= MAX_ATTACHMENTS) {
        throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments per reply`);
      }
    }

    // Determine type from MIME type
    const type = getAttachmentType(args.mimeType);

    // Create the attachment record
    const attachmentId = await ctx.db.insert('attachments', {
      storageId: args.storageId,
      type,
      filename: args.filename,
      size: args.size,
      mimeType: args.mimeType,
      width: args.width,
      height: args.height,
      isSpoiler: args.isSpoiler,
      altText: args.altText,
      postId: args.postId,
      replyId: args.replyId,
      uploaderId: person._id,
      createdAt: Date.now(),
    });

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
    attachments: v.array(
      v.object({
        storageId: v.id('_storage'),
        filename: v.string(),
        size: v.number(),
        mimeType: v.string(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        isSpoiler: v.optional(v.boolean()),
        altText: v.optional(v.string()),
      })
    ),
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    await requireAttachmentParentAccess(ctx, args, person._id, true);

    // Validate attachment count
    if (args.attachments.length > MAX_ATTACHMENTS) {
      throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments allowed`);
    }

    // Check existing count
    if (args.postId) {
      const existingCount = await ctx.db
        .query('attachments')
        .withIndex('by_post', q => q.eq('postId', args.postId))
        .collect();
      if (existingCount.length + args.attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments per post`);
      }
    } else if (args.replyId) {
      const existingCount = await ctx.db
        .query('attachments')
        .withIndex('by_reply', q => q.eq('replyId', args.replyId))
        .collect();
      if (existingCount.length + args.attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments per reply`);
      }
    }

    const storageIds = new Set<string>();
    const attachmentIds = [];

    for (const attachment of args.attachments) {
      if (storageIds.has(attachment.storageId)) {
        throw new Error('The same uploaded file cannot be attached twice');
      }
      storageIds.add(attachment.storageId);

      await requireValidStoredFile(
        ctx,
        attachment.storageId,
        attachment.size,
        attachment.mimeType
      );
      await requireUnclaimedStorage(ctx, attachment.storageId);

      // Validate each file
      if (attachment.size > MAX_FILE_SIZE) {
        throw new Error(
          `File ${attachment.filename} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
      }

      if (!isAllowedMimeType(attachment.mimeType)) {
        throw new Error(
          `File type ${attachment.mimeType} is not allowed for ${attachment.filename}`
        );
      }

      const type = getAttachmentType(attachment.mimeType);

      const attachmentId = await ctx.db.insert('attachments', {
        storageId: attachment.storageId,
        type,
        filename: attachment.filename,
        size: attachment.size,
        mimeType: attachment.mimeType,
        width: attachment.width,
        height: attachment.height,
        isSpoiler: attachment.isSpoiler,
        altText: attachment.altText,
        postId: args.postId,
        replyId: args.replyId,
        uploaderId: person._id,
        createdAt: Date.now(),
      });

      attachmentIds.push(attachmentId);
    }

    return { attachmentIds };
  },
});

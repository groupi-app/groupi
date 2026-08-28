import { type Infer, v } from 'convex/values';

import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { requireEventRole } from '../auth';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

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
} as const;

export const attachmentInputValidator = v.object({
  storageId: v.id('_storage'),
  filename: v.string(),
  size: v.number(),
  mimeType: v.string(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  isSpoiler: v.optional(v.boolean()),
  altText: v.optional(v.string()),
});

export type AttachmentInput = Infer<typeof attachmentInputValidator>;

export type AttachmentParent = {
  postId?: Id<'posts'>;
  replyId?: Id<'replies'>;
};

function getAttachmentType(
  mimeType: string
): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' {
  if ((ALLOWED_MIME_TYPES.IMAGE as readonly string[]).includes(mimeType)) {
    return 'IMAGE';
  }
  if ((ALLOWED_MIME_TYPES.VIDEO as readonly string[]).includes(mimeType)) {
    return 'VIDEO';
  }
  if ((ALLOWED_MIME_TYPES.AUDIO as readonly string[]).includes(mimeType)) {
    return 'AUDIO';
  }
  return 'FILE';
}

function isAllowedMimeType(mimeType: string): boolean {
  return Object.values(ALLOWED_MIME_TYPES).some(types =>
    (types as readonly string[]).includes(mimeType)
  );
}

export async function requireAttachmentParentAccess(
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
    if (!post) throw new Error('Attachment parent not found');

    await requireEventRole(ctx, post.eventId, 'ATTENDEE');
    if (requireParentAuthor && post.authorId !== personId) {
      throw new Error('You can only attach files to your own content');
    }
    return;
  }

  const reply = await ctx.db.get(parent.replyId!);
  if (!reply) throw new Error('Attachment parent not found');

  const post = await ctx.db.get(reply.postId);
  if (!post) throw new Error('Attachment parent not found');

  await requireEventRole(ctx, post.eventId, 'ATTENDEE');
  if (requireParentAuthor && reply.authorId !== personId) {
    throw new Error('You can only attach files to your own content');
  }
}

async function requireValidStoredFile(
  ctx: MutationCtx,
  attachment: AttachmentInput
) {
  const storedFile = await ctx.db.system.get('_storage', attachment.storageId);
  if (!storedFile) throw new Error('Uploaded file not found');

  if (storedFile.size !== attachment.size) {
    throw new Error('Uploaded file size does not match');
  }
  if (storedFile.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
  if (
    storedFile.contentType &&
    storedFile.contentType !== attachment.mimeType
  ) {
    throw new Error('Uploaded file type does not match');
  }

  const effectiveMimeType = storedFile.contentType || attachment.mimeType;
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

export async function createAttachmentsForParent(
  ctx: MutationCtx,
  args: AttachmentParent & {
    attachments: AttachmentInput[];
    personId: Id<'persons'>;
  }
): Promise<Id<'attachments'>[]> {
  await requireAttachmentParentAccess(ctx, args, args.personId, true);

  if (args.attachments.length > MAX_ATTACHMENTS) {
    throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments allowed`);
  }

  const existingAttachments = args.postId
    ? await ctx.db
        .query('attachments')
        .withIndex('by_post', q => q.eq('postId', args.postId))
        .take(MAX_ATTACHMENTS + 1)
    : await ctx.db
        .query('attachments')
        .withIndex('by_reply', q => q.eq('replyId', args.replyId))
        .take(MAX_ATTACHMENTS + 1);

  if (existingAttachments.length + args.attachments.length > MAX_ATTACHMENTS) {
    throw new Error(
      `Maximum of ${MAX_ATTACHMENTS} attachments per ${args.postId ? 'post' : 'reply'}`
    );
  }

  const storageIds = new Set<string>();
  for (const attachment of args.attachments) {
    if (storageIds.has(attachment.storageId)) {
      throw new Error('The same uploaded file cannot be attached twice');
    }
    storageIds.add(attachment.storageId);
    await requireValidStoredFile(ctx, attachment);
    await requireUnclaimedStorage(ctx, attachment.storageId);
  }

  const createdAt = Date.now();
  const attachmentIds: Id<'attachments'>[] = [];
  for (const attachment of args.attachments) {
    attachmentIds.push(
      await ctx.db.insert('attachments', {
        storageId: attachment.storageId,
        type: getAttachmentType(attachment.mimeType),
        filename: attachment.filename,
        size: attachment.size,
        mimeType: attachment.mimeType,
        width: attachment.width,
        height: attachment.height,
        isSpoiler: attachment.isSpoiler,
        altText: attachment.altText,
        postId: args.postId,
        replyId: args.replyId,
        uploaderId: args.personId,
        createdAt,
      })
    );
  }
  return attachmentIds;
}

export async function deleteAttachmentsForParent(
  ctx: MutationCtx,
  args: AttachmentParent & {
    attachmentIds: Id<'attachments'>[];
    personId: Id<'persons'>;
  }
) {
  if (args.attachmentIds.length === 0) return;

  await requireAttachmentParentAccess(ctx, args, args.personId, true);

  const attachments = await Promise.all(
    args.attachmentIds.map(attachmentId => ctx.db.get(attachmentId))
  );

  for (const attachment of attachments) {
    if (!attachment) throw new Error('Attachment not found');
    if (attachment.uploaderId !== args.personId) {
      throw new Error('You can only delete your own attachments');
    }
    if (
      attachment.postId !== args.postId ||
      attachment.replyId !== args.replyId
    ) {
      throw new Error('Attachment does not belong to this content');
    }
  }

  for (const attachment of attachments) {
    if (!attachment) continue;

    const otherAttachment = await ctx.db
      .query('attachments')
      .withIndex('by_storage', q => q.eq('storageId', attachment.storageId))
      .filter(q => q.neq(q.field('_id'), attachment._id))
      .first();

    await ctx.db.delete(attachment._id);
    if (!otherAttachment) {
      await ctx.storage.delete(attachment.storageId);
    }
  }
}

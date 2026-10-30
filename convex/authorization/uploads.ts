import { uploadDetails } from '../files/contracts';
import { internalMutation, type MutationCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { authorizeCredential, audit, denied } from './model';
import { claimUpload } from '../files/uploads';
import {
  requireValidStoredFile,
  getAttachmentType,
  type AttachmentInput,
  MAX_ATTACHMENTS,
  ALLOWED_MIME_TYPES,
} from '../attachments/model';
export const register = internalMutation({
  args: {
    credentialId: v.id('authorizationCredentials'),
    eventId: v.id('events'),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    size: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { principal, grant } = await authorizeCredential(
      ctx,
      args.credentialId,
      'files.upload',
      args.eventId,
      Date.now()
    );
    if (
      args.size <= 0 ||
      args.size > 10 * 1024 * 1024 ||
      !Object.values(ALLOWED_MIME_TYPES).some(types =>
        (types as readonly string[]).includes(args.mimeType)
      )
    )
      throw denied('Unsupported attachment type or size.');
    const metadata = await ctx.db.system.get(args.storageId);
    if (
      !metadata ||
      metadata.size !== args.size ||
      (metadata.contentType !== undefined &&
        metadata.contentType !== args.mimeType)
    )
      throw denied('Upload metadata mismatch.');
    await ctx.db.insert('uploads', {
      storageId: args.storageId,
      personId:
        principal.kind === 'user' ? grant.grantorPersonId : principal._id,
      eventId: args.eventId,
      purpose: 'attachment',
      mimeType: args.mimeType,
      size: args.size,
      claimed: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      86400000,
      internal.files.uploads.expireUpload,
      { storageId: args.storageId }
    );
    await audit(
      ctx,
      grant,
      'files.upload',
      'allowed',
      'registered',
      args.eventId,
      args.credentialId
    );
    return null;
  },
});
export async function checkBoundedAttachments(
  ctx: MutationCtx,
  credentialId: Id<'authorizationCredentials'>,
  eventId: Id<'events'>,
  attachments: AttachmentInput[]
) {
  const { principal, grant } = await authorizeCredential(
    ctx,
    credentialId,
    'files.upload',
    eventId,
    Date.now()
  );
  const actorId =
    principal.kind === 'user' ? grant.grantorPersonId : principal._id;
  if (attachments.length > MAX_ATTACHMENTS)
    throw denied('Too many attachments.');
  for (const attachment of attachments) {
    if (
      !attachment.filename.trim() ||
      attachment.filename.length > 255 ||
      (attachment.altText && attachment.altText.length > 1000)
    )
      throw denied('Invalid attachment description.');
    const upload = await ctx.db
      .query('uploads')
      .withIndex('by_storage', q => q.eq('storageId', attachment.storageId))
      .unique();
    if (
      !upload ||
      upload.eventId !== eventId ||
      upload.personId !== actorId ||
      upload.claimed
    )
      throw denied('Upload must belong to this principal and event.');
    await requireValidStoredFile(ctx, attachment);
  }
  return actorId;
}
export async function attachIntegrationFiles(
  ctx: MutationCtx,
  principalId: Id<'authorizationPrincipals'>,
  parent: { postId?: Id<'posts'>; replyId?: Id<'replies'> },
  attachments: AttachmentInput[]
) {
  const existing = await (
    parent.postId
      ? ctx.db
          .query('attachments')
          .withIndex('by_post', q => q.eq('postId', parent.postId))
      : ctx.db
          .query('attachments')
          .withIndex('by_reply', q => q.eq('replyId', parent.replyId))
  ).collect();
  if (existing.length + attachments.length > MAX_ATTACHMENTS)
    throw denied('Too many attachments.');
  for (const attachment of attachments) {
    await claimUpload(ctx, principalId, attachment.storageId, 'attachment');
    if (
      await ctx.db
        .query('attachments')
        .withIndex('by_storage', q => q.eq('storageId', attachment.storageId))
        .first()
    )
      throw denied('File is already attached.');
    await ctx.db.insert('attachments', {
      ...attachment,
      ...parent,
      type: getAttachmentType(attachment.mimeType),
      uploaderId: principalId,
      createdAt: Date.now(),
    });
  }
}
export const read = internalMutation({
  args: {
    credentialId: v.id('authorizationCredentials'),
    storageId: v.id('_storage'),
  },
  returns: uploadDetails,
  handler: async (ctx, { credentialId, storageId }) => {
    const attachment = await ctx.db
      .query('attachments')
      .withIndex('by_storage', q => q.eq('storageId', storageId))
      .unique();
    let eventId: Id<'events'> | undefined;
    if (attachment) {
      if (Boolean(attachment.postId) === Boolean(attachment.replyId))
        throw denied();
      const reply = attachment.replyId
        ? await ctx.db.get(attachment.replyId)
        : null;
      const post = attachment.postId
        ? await ctx.db.get(attachment.postId)
        : reply
          ? await ctx.db.get(reply.postId)
          : null;
      // An attached file inherits only its current content parent. A bounded
      // Event credential must never fall back to the upload's former Event when
      // native clients attach that upload to Group content or remove its parent.
      if (!post?.eventId || post.groupId) throw denied();
      eventId = post.eventId;
    }
    const upload = await ctx.db
      .query('uploads')
      .withIndex('by_storage', q => q.eq('storageId', storageId))
      .unique();
    if (!attachment) eventId = upload?.eventId;
    if (!eventId) throw denied();
    const { principal, grant } = await authorizeCredential(
      ctx,
      credentialId,
      'files.read',
      eventId,
      Date.now()
    );
    if (
      !attachment &&
      (!upload ||
        upload.claimed ||
        upload.personId !==
          (principal.kind === 'user' ? grant.grantorPersonId : principal._id))
    )
      throw denied();
    await audit(
      ctx,
      grant,
      'files.read',
      'allowed',
      'authorized',
      eventId,
      credentialId
    );
    return {
      storageId,
      filename: attachment?.filename ?? 'upload',
      mimeType: attachment?.mimeType ?? upload!.mimeType,
      size: attachment?.size ?? upload!.size,
      url: await ctx.storage.getUrl(storageId),
    };
  },
});
export const discard = internalMutation({
  args: {
    credentialId: v.id('authorizationCredentials'),
    storageId: v.id('_storage'),
  },
  returns: v.null(),
  handler: async (ctx, { credentialId, storageId }) => {
    const upload = await ctx.db
      .query('uploads')
      .withIndex('by_storage', q => q.eq('storageId', storageId))
      .unique();
    if (!upload?.eventId) throw denied();
    const { principal, grant } = await authorizeCredential(
      ctx,
      credentialId,
      'files.upload',
      upload.eventId,
      Date.now()
    );
    if (
      upload.claimed ||
      upload.personId !==
        (principal.kind === 'user' ? grant.grantorPersonId : principal._id)
    )
      throw denied();
    await ctx.storage.delete(storageId);
    await ctx.db.delete(upload._id);
    await audit(
      ctx,
      grant,
      'files.upload',
      'allowed',
      'discarded',
      upload.eventId,
      credentialId
    );
    return null;
  },
});

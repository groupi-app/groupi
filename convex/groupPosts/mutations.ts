import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { attachmentInputValidator } from '../attachments/model';
import * as model from './model';
export const createPost = mutation({
  args: {
    groupId: v.id('groups'),
    title: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(attachmentInputValidator)),
  },
  returns: v.id('posts'),
  handler: async (ctx, input) =>
    model.create(ctx, (await requireAuth(ctx)).person._id, input),
});
export const updatePost = mutation({
  args: {
    postId: v.id('posts'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
    attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
  },
  returns: v.null(),
  handler: async (ctx, input) =>
    model.update(ctx, (await requireAuth(ctx)).person._id, input),
});
export const deletePost = mutation({
  args: { postId: v.id('posts') },
  returns: v.null(),
  handler: async (ctx, { postId }) =>
    model.remove(ctx, (await requireAuth(ctx)).person._id, postId),
});

export const createReply = mutation({
  args: {
    postId: v.id('posts'),
    content: v.string(),
    attachments: v.optional(v.array(attachmentInputValidator)),
  },
  returns: v.id('replies'),
  handler: async (ctx, { postId, content, attachments }) =>
    model.createReply(
      ctx,
      (await requireAuth(ctx)).person._id,
      postId,
      content,
      attachments
    ),
});
export const updateReply = mutation({
  args: {
    replyId: v.id('replies'),
    content: v.string(),
    attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
    attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { replyId, content, attachmentsToAdd, attachmentIdsToDelete }
  ) =>
    model.updateReply(
      ctx,
      (await requireAuth(ctx)).person._id,
      replyId,
      content,
      attachmentsToAdd,
      attachmentIdsToDelete
    ),
});
export const deleteReply = mutation({
  args: { replyId: v.id('replies') },
  returns: v.null(),
  handler: async (ctx, { replyId }) =>
    model.deleteReply(ctx, (await requireAuth(ctx)).person._id, replyId),
});

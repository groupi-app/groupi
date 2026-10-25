import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import * as model from './model';
export const createPost = mutation({
  args: { groupId: v.id('groups'), title: v.string(), content: v.string() },
  returns: v.id('groupPosts'),
  handler: async (ctx, input) =>
    model.create(ctx, (await requireAuth(ctx)).person._id, input),
});
export const updatePost = mutation({
  args: { postId: v.id('groupPosts'), title: v.string(), content: v.string() },
  returns: v.null(),
  handler: async (ctx, input) =>
    model.update(ctx, (await requireAuth(ctx)).person._id, input),
});
export const deletePost = mutation({
  args: { postId: v.id('groupPosts') },
  returns: v.null(),
  handler: async (ctx, { postId }) =>
    model.remove(ctx, (await requireAuth(ctx)).person._id, postId),
});

export const createReply = mutation({
  args: { postId: v.id('groupPosts'), content: v.string() },
  returns: v.id('groupPostReplies'),
  handler: async (ctx, { postId, content }) =>
    model.createReply(
      ctx,
      (await requireAuth(ctx)).person._id,
      postId,
      content
    ),
});
export const updateReply = mutation({
  args: { replyId: v.id('groupPostReplies'), content: v.string() },
  returns: v.null(),
  handler: async (ctx, { replyId, content }) =>
    model.updateReply(
      ctx,
      (await requireAuth(ctx)).person._id,
      replyId,
      content
    ),
});
export const deleteReply = mutation({
  args: { replyId: v.id('groupPostReplies') },
  returns: v.null(),
  handler: async (ctx, { replyId }) =>
    model.deleteReply(ctx, (await requireAuth(ctx)).person._id, replyId),
});

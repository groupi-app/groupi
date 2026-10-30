import { setRepliesDisabledForPerson, setPinnedForPerson } from './controls';
import {
  createPostArgs,
  updatePostArgs,
  deletePostArgs,
  postDocument,
} from './model';
import {
  createPostForPerson,
  updatePostForPerson,
  deletePostForPerson,
} from './writes';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

export const createPost = mutation({
  args: createPostArgs.fields,
  returns: v.object({
    postId: v.id('posts'),
    post: v.union(postDocument, v.null()),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createPostForPerson(ctx, person._id, args);
  },
});

export const updatePost = mutation({
  args: updatePostArgs.fields,
  returns: v.object({ post: v.union(postDocument, v.null()) }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updatePostForPerson(ctx, person._id, args);
  },
});

export const deletePost = mutation({
  args: deletePostArgs.fields,
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return deletePostForPerson(ctx, person._id, args);
  },
});

export const setRepliesDisabled = mutation({
  args: {
    postId: v.id('posts'),
    repliesDisabled: v.boolean(),
    expectedRevision: v.number(),
  },
  returns: v.object({ revision: v.number(), repliesDisabled: v.boolean() }),
  handler: async (ctx, args) =>
    setRepliesDisabledForPerson(ctx, (await requireAuth(ctx)).person._id, args),
});
export const setPinned = mutation({
  args: {
    postId: v.id('posts'),
    pinned: v.boolean(),
    expectedRevision: v.number(),
  },
  returns: v.object({
    revision: v.number(),
    pinned: v.boolean(),
    pinnedAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) =>
    setPinnedForPerson(ctx, (await requireAuth(ctx)).person._id, args),
});

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

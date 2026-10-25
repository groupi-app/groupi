import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { requireGroupMemberContent } from '../groups/contentAccess';
import { post, reply } from './contracts';
import * as model from './model';
export const getPost = query({
  args: { postId: v.id('groupPosts') },
  returns: v.union(post, v.null()),
  handler: async (ctx, { postId }) =>
    model.get(ctx, (await requireAuth(ctx)).person._id, postId),
});
export const listPosts = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(post),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, { groupId, paginationOpts }) => {
    const { person } = await requireAuth(ctx);
    await requireGroupMemberContent(ctx, groupId, person._id);
    if (paginationOpts.numItems < 1 || paginationOpts.numItems > 100)
      throw new Error('Page size must be 1–100.');
    const result = await ctx.db
      .query('groupPosts')
      .withIndex('by_groupId', q => q.eq('groupId', groupId))
      .order('desc')
      .paginate(paginationOpts);
    return {
      page: await Promise.all(
        result.page.map(row => model.present(ctx, person._id, row))
      ),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const listReplies = query({
  args: { postId: v.id('groupPosts'), paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(reply),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, { postId, paginationOpts }) => {
    const { person } = await requireAuth(ctx);
    const post = await model.get(ctx, person._id, postId);
    if (!post) throw new Error('Post unavailable.');
    if (paginationOpts.numItems < 1 || paginationOpts.numItems > 100)
      throw new Error('Page size must be 1–100.');
    const result = await ctx.db
      .query('groupPostReplies')
      .withIndex('by_postId', q => q.eq('postId', postId))
      .order('asc')
      .paginate(paginationOpts);
    return {
      page: await Promise.all(
        result.page.map(row => model.presentReply(ctx, person._id, row))
      ),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

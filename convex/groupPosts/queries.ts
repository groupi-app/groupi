import { pinnedPosts } from '../posts/controls';
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { livePerson } from '../groups/model';
import { checkIsBlocked } from '../lib/privacy';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
import { requireGroupMemberContent } from '../groups/contentAccess';
import { post, reply } from './contracts';
import * as model from './model';
export const getPost = query({
  args: { postId: v.id('posts') },
  returns: v.union(post, v.null()),
  handler: async (ctx, { postId }) =>
    model.get(ctx, (await requireAuth(ctx)).person._id, postId),
});
export const listPosts = query({
  args: {
    groupId: v.id('groups'),
    paginationOpts: paginationOptsValidator,
    excludePinned: v.optional(v.boolean()),
  },
  returns: v.object({
    page: v.array(post),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, { groupId, paginationOpts, excludePinned }) => {
    const { person } = await requireAuth(ctx);
    await requireGroupMemberContent(ctx, groupId, person._id);
    if (paginationOpts.numItems < 1 || paginationOpts.numItems > 100)
      throw new Error('Page size must be 1–100.');
    const source = excludePinned
      ? ctx.db
          .query('posts')
          .withIndex('by_groupId_and_pinnedAt', q =>
            q.eq('groupId', groupId).eq('pinnedAt', undefined)
          )
      : ctx.db
          .query('posts')
          .withIndex('by_groupId', q => q.eq('groupId', groupId));
    const result = await source.order('desc').paginate(paginationOpts);
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
  args: { postId: v.id('posts'), paginationOpts: paginationOptsValidator },
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
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
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

/** Current eligible members only; mention menus expose no private contact details. */
export const mentionMembers = query({
  args: { groupId: v.id('groups') },
  returns: v.array(
    v.object({
      personId: v.id('persons'),
      userId: v.string(),
      name: v.string(),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { groupId }) => {
    const { person } = await requireAuth(ctx);
    await requireGroupMemberContent(ctx, groupId, person._id);
    const members = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', groupId))
      .collect();
    const result = [];
    for (const member of members) {
      if (
        !(await canAccessGroupMemberContent(ctx, groupId, member.personId)) ||
        (await checkIsBlocked(ctx, person._id, member.personId))
      )
        continue;
      const identity = await livePerson(ctx, member.personId);
      if (identity)
        result.push({
          personId: member.personId,
          userId: identity.user._id,
          name: identity.user.name || identity.user.username || 'Member',
          username: identity.user.username ?? undefined,
          image: identity.user.image ?? undefined,
        });
    }
    return result;
  },
});

export const listPinnedPosts = query({
  args: { groupId: v.id('groups') },
  returns: v.array(post),
  handler: async (ctx, { groupId }) => {
    const { person } = await requireAuth(ctx);
    await requireGroupMemberContent(ctx, groupId, person._id);
    return Promise.all(
      (await pinnedPosts(ctx, { groupId })).map(row =>
        model.present(ctx, person._id, row)
      )
    );
  },
});

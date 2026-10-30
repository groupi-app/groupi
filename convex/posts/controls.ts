import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import {
  discussionParent,
  discussionPermissions,
} from '../lib/discussionAccess';

export const controlFields = {
  repliesDisabled: v.boolean(),
  repliesRevision: v.number(),
  pinnedAt: v.optional(v.number()),
  pinRevision: v.number(),
  canSetRepliesDisabled: v.boolean(),
  canPin: v.boolean(),
};
export function postControls(
  post: Doc<'posts'>,
  personId: Id<'persons'>,
  canManage: boolean
) {
  return {
    repliesDisabled: post.repliesDisabled ?? false,
    repliesRevision: post.repliesRevision ?? 0,
    pinnedAt: post.pinnedAt,
    pinRevision: post.pinRevision ?? 0,
    canSetRepliesDisabled: post.authorId === personId || canManage,
    canPin: canManage,
  };
}
export function requireRepliesOpen(post: Doc<'posts'>) {
  if (post.repliesDisabled)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Replies are disabled for this post.',
    });
}
function revision(actual: number, expected: number) {
  if (!Number.isSafeInteger(expected) || expected < 0)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'A valid post revision is required.',
    });
  if (actual !== expected)
    throw new ConvexError({
      code: 'STALE_REVISION',
      message: 'This post changed. Refresh before trying again.',
    });
}
async function managedPost(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  const post = await ctx.db.get(postId);
  if (!post)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
  const permissions = await discussionPermissions(ctx, post, personId);
  return { post, ...permissions };
}
export async function setRepliesDisabledForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  args: {
    postId: Id<'posts'>;
    repliesDisabled: boolean;
    expectedRevision: number;
  }
) {
  const { post, canManage } = await managedPost(ctx, personId, args.postId);
  if (post.authorId !== personId && !canManage)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only the post author or a moderator can change replies.',
    });
  revision(post.repliesRevision ?? 0, args.expectedRevision);
  if ((post.repliesDisabled ?? false) === args.repliesDisabled)
    return {
      revision: post.repliesRevision ?? 0,
      repliesDisabled: args.repliesDisabled,
    };
  const next = (post.repliesRevision ?? 0) + 1;
  await ctx.db.patch(post._id, {
    repliesDisabled: args.repliesDisabled,
    repliesRevision: next,
  });
  return { revision: next, repliesDisabled: args.repliesDisabled };
}
/** Bounded indexed retrieval is independent of chronological feed cursors. */
export async function pinnedPosts(
  ctx: QueryCtx | MutationCtx,
  parent: { eventId?: Id<'events'>; groupId?: Id<'groups'> }
) {
  const canonical = discussionParent(parent);
  return canonical.eventId
    ? ctx.db
        .query('posts')
        .withIndex('by_event_and_pinnedAt', q =>
          q.eq('eventId', canonical.eventId).gt('pinnedAt', 0)
        )
        .order('desc')
        .take(3)
    : ctx.db
        .query('posts')
        .withIndex('by_groupId_and_pinnedAt', q =>
          q.eq('groupId', canonical.groupId!).gt('pinnedAt', 0)
        )
        .order('desc')
        .take(3);
}
export async function setPinnedForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  args: { postId: Id<'posts'>; pinned: boolean; expectedRevision: number }
) {
  const { post, canManage } = await managedPost(ctx, personId, args.postId);
  if (!canManage)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only moderators can pin posts.',
    });
  revision(post.pinRevision ?? 0, args.expectedRevision);
  if ((post.pinnedAt !== undefined) === args.pinned)
    return {
      revision: post.pinRevision ?? 0,
      pinned: args.pinned,
      pinnedAt: post.pinnedAt,
    };
  const current = await pinnedPosts(ctx, post);
  if (args.pinned && current.length >= 3)
    throw new ConvexError({
      code: 'PIN_LIMIT',
      message:
        'Three posts are already pinned. Unpin one before pinning another.',
    });
  const pinnedAt = args.pinned
    ? Math.max(Date.now(), ...current.map(row => (row.pinnedAt ?? 0) + 1))
    : undefined;
  const next = (post.pinRevision ?? 0) + 1;
  await ctx.db.patch(post._id, { pinnedAt, pinRevision: next });
  return { revision: next, pinned: args.pinned, pinnedAt };
}

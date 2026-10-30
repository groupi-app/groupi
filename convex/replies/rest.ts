import { requireEventPost } from '../lib/discussionAccess';
import { ConvexError } from 'convex/values';
import { internalQuery, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { getEventMembershipForPerson } from '../auth';
import {
  createReplyForPerson,
  updateReplyForPerson,
  deleteReplyForPerson,
} from './writes';
import { replyDetail, readReplySummary } from './presentation';

export const listPostReplies = internalQuery({
  args: { postId: v.string(), personId: v.string() },
  returns: v.union(v.object({ replies: v.array(replyDetail) }), v.null()),
  handler: async (ctx, { postId, personId }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (
      !post ||
      !post.eventId ||
      post.groupId ||
      !(await getEventMembershipForPerson(
        ctx,
        post.eventId,
        personId as Id<'persons'>
      ))
    )
      return null;
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .order('asc')
      .collect();
    const summaries = await Promise.all(
      replies.map(async reply => ({
        ...(await readReplySummary(ctx, reply)),
        postId: reply.postId,
      }))
    );
    return { replies: summaries.filter(reply => reply.author !== null) };
  },
});

export const createReply = internalMutation({
  args: { postId: v.string(), personId: v.string(), text: v.string() },
  returns: v.union(v.object({ replyId: v.id('replies') }), v.null()),
  handler: async (ctx, { postId, personId, text }) => {
    // Preserve the REST not-found response for missing or inaccessible threads.
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (
      !post ||
      !post.eventId ||
      post.groupId ||
      !(await getEventMembershipForPerson(
        ctx,
        post.eventId,
        personId as Id<'persons'>
      ))
    )
      return null;
    return createReplyForPerson(ctx, personId as Id<'persons'>, {
      postId: post._id,
      text,
    });
  },
});

export const updateReply = internalMutation({
  args: { replyId: v.string(), personId: v.string(), text: v.string() },
  returns: replyDetail,
  handler: async (ctx, { replyId, personId, text }) => {
    const existing = await ctx.db.get(replyId as Id<'replies'>);
    const parent = existing ? await ctx.db.get(existing.postId) : null;
    if (!parent)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
    requireEventPost(parent);
    const { reply } = await updateReplyForPerson(
      ctx,
      personId as Id<'persons'>,
      { replyId: replyId as Id<'replies'>, text }
    );
    return { ...(await readReplySummary(ctx, reply!)), postId: reply!.postId };
  },
});

export const deleteReply = internalMutation({
  args: { replyId: v.string(), personId: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { replyId, personId }) => {
    const existing = await ctx.db.get(replyId as Id<'replies'>);
    const parent = existing ? await ctx.db.get(existing.postId) : null;
    if (!parent)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
    requireEventPost(parent);
    return deleteReplyForPerson(ctx, personId as Id<'persons'>, {
      replyId: replyId as Id<'replies'>,
    });
  },
});

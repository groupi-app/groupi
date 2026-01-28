import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { getPersonWithUser } from '../../../auth';

/**
 * Internal queries and mutations for reply routes
 */

export const listPostReplies = internalQuery({
  args: {
    postId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { postId, personId }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (!post) return null;

    // Check membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId as Id<'persons'>).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) return null;

    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId as Id<'posts'>))
      .order('asc')
      .collect();

    const repliesWithAuthors = await Promise.all(
      replies.map(async reply => {
        const authorData = await getPersonWithUser(ctx, reply.authorId);
        return {
          id: reply._id,
          text: reply.text,
          createdAt: reply._creationTime,
          updatedAt: reply.updatedAt ?? null,
          postId: reply.postId,
          author: authorData
            ? {
                id: authorData.person._id,
                user: {
                  id: authorData.user._id,
                  name: authorData.user.name ?? null,
                  email: authorData.user.email ?? null,
                  image: authorData.user.image ?? null,
                  username: authorData.user.username ?? null,
                },
              }
            : null,
        };
      })
    );

    return {
      replies: repliesWithAuthors.filter(r => r.author !== null),
    };
  },
});

export const createReply = internalMutation({
  args: {
    postId: v.string(),
    personId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { postId, personId, text }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (!post) return null;

    // Get membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId as Id<'persons'>).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) return null;

    const replyId = await ctx.db.insert('replies', {
      text: text.trim(),
      authorId: personId as Id<'persons'>,
      postId: postId as Id<'posts'>,
      membershipId: membership._id,
    });

    return { replyId };
  },
});

export const updateReply = internalMutation({
  args: {
    replyId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { replyId, text }) => {
    const reply = await ctx.db.get(replyId as Id<'replies'>);
    if (!reply) {
      throw new Error('Reply not found');
    }

    await ctx.db.patch(replyId as Id<'replies'>, {
      text: text.trim(),
      updatedAt: Date.now(),
    });

    const updatedReply = await ctx.db.get(replyId as Id<'replies'>);
    const authorData = updatedReply
      ? await getPersonWithUser(ctx, updatedReply.authorId)
      : null;

    return {
      id: updatedReply!._id,
      text: updatedReply!.text,
      createdAt: updatedReply!._creationTime,
      updatedAt: updatedReply!.updatedAt ?? null,
      postId: updatedReply!.postId,
      author: authorData
        ? {
            id: authorData.person._id,
            user: {
              id: authorData.user._id,
              name: authorData.user.name ?? null,
              email: authorData.user.email ?? null,
              image: authorData.user.image ?? null,
              username: authorData.user.username ?? null,
            },
          }
        : null,
    };
  },
});

export const deleteReply = internalMutation({
  args: {
    replyId: v.string(),
  },
  handler: async (ctx, { replyId }) => {
    const reply = await ctx.db.get(replyId as Id<'replies'>);
    if (!reply) {
      throw new Error('Reply not found');
    }

    // Delete attachments
    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_reply', q => q.eq('replyId', replyId as Id<'replies'>))
      .collect();

    for (const attachment of attachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
    }

    // Delete the reply
    await ctx.db.delete(replyId as Id<'replies'>);

    return { success: true };
  },
});

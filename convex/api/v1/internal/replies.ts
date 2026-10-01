import {
  createReplyForPerson,
  updateReplyForPerson,
  deleteReplyForPerson,
} from '../../../replies/mutations';
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
    const result = await createReplyForPerson(ctx, personId as Id<'persons'>, {
      postId: postId as Id<'posts'>,
      text,
    });
    return { replyId: result.replyId };
  },
});

export const updateReply = internalMutation({
  args: {
    personId: v.string(),
    replyId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { replyId, personId, text }) => {
    await updateReplyForPerson(ctx, personId as Id<'persons'>, {
      replyId: replyId as Id<'replies'>,
      text,
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
    personId: v.string(),
    replyId: v.string(),
  },
  handler: async (ctx, { replyId, personId }) => {
    return deleteReplyForPerson(ctx, personId as Id<'persons'>, {
      replyId: replyId as Id<'replies'>,
    });
  },
});

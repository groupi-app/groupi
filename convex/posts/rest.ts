import { requireEventPost } from '../lib/discussionAccess';
import {
  internalQuery,
  internalMutation,
  type QueryCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import { getEventMembershipForPerson } from '../auth';
import {
  createPostForPerson,
  updatePostForPerson,
  deletePostForPerson,
} from './writes';
import { discussionAuthor, readDiscussionAuthor } from './presentation';
import { replySummary, readReplySummary } from '../replies/presentation';

const postSummary = v.object({
  id: v.id('posts'),
  title: v.string(),
  content: v.string(),
  createdAt: v.number(),
  editedAt: v.union(v.number(), v.null()),
  author: discussionAuthor,
});
const postDetail = v.object({
  ...postSummary.fields,
  eventId: v.id('events'),
  replies: v.array(replySummary),
});

async function readPostSummary(ctx: QueryCtx, post: Doc<'posts'>) {
  return {
    id: post._id,
    title: post.title,
    content: post.content,
    createdAt: post._creationTime,
    editedAt: post.editedAt ?? null,
    author: await readDiscussionAuthor(ctx, post.authorId),
  };
}
async function readPostDetail(ctx: QueryCtx, storedPost: Doc<'posts'>) {
  const post = requireEventPost(storedPost);
  const replies = await ctx.db
    .query('replies')
    .withIndex('by_post', q => q.eq('postId', post._id))
    .order('asc')
    .collect();
  const summaries = await Promise.all(
    replies.map(reply => readReplySummary(ctx, reply))
  );
  return {
    ...(await readPostSummary(ctx, post)),
    eventId: post.eventId,
    replies: summaries.filter(reply => reply.author !== null),
  };
}

export const listEventPosts = internalQuery({
  args: { eventId: v.string(), personId: v.string() },
  returns: v.object({
    posts: v.array(v.object({ ...postSummary.fields, replyCount: v.number() })),
  }),
  handler: async (ctx, { eventId, personId }) => {
    const membership = await getEventMembershipForPerson(
      ctx,
      eventId as Id<'events'>,
      personId as Id<'persons'>
    );
    if (!membership)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Event membership required',
      });
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .order('desc')
      .collect();
    const summaries = await Promise.all(
      posts.map(async post => ({
        ...(await readPostSummary(ctx, post)),
        replyCount: (
          await ctx.db
            .query('replies')
            .withIndex('by_post', q => q.eq('postId', post._id))
            .collect()
        ).length,
      }))
    );
    return { posts: summaries.filter(post => post.author !== null) };
  },
});

export const getPostDetail = internalQuery({
  args: { postId: v.string(), personId: v.string() },
  returns: v.union(postDetail, v.null()),
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
    return readPostDetail(ctx, post);
  },
});

export const createPost = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  returns: v.object({ postId: v.id('posts') }),
  handler: async (ctx, { eventId, personId, title, content }) => {
    const { postId } = await createPostForPerson(
      ctx,
      personId as Id<'persons'>,
      { eventId: eventId as Id<'events'>, title, content }
    );
    return { postId };
  },
});

export const updatePost = internalMutation({
  args: {
    postId: v.string(),
    personId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: postDetail,
  handler: async (ctx, { postId, personId, ...updates }) => {
    const existing = await ctx.db.get(postId as Id<'posts'>);
    if (!existing)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
    requireEventPost(existing);
    const { post } = await updatePostForPerson(ctx, personId as Id<'persons'>, {
      postId: postId as Id<'posts'>,
      ...updates,
    });
    return readPostDetail(ctx, post!);
  },
});

export const deletePost = internalMutation({
  args: { postId: v.string(), personId: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { postId, personId }) => {
    const existing = await ctx.db.get(postId as Id<'posts'>);
    if (!existing)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
    requireEventPost(existing);
    return deletePostForPerson(ctx, personId as Id<'persons'>, {
      postId: existing._id,
    });
  },
});

import {
  createPostForPerson,
  updatePostForPerson,
  deletePostForPerson,
} from '../../../posts/mutations';
import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { getPersonWithUser } from '../../../auth';

/**
 * Internal queries and mutations for post routes
 */

export const listEventPosts = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .order('desc')
      .collect();

    const postsWithAuthors = await Promise.all(
      posts.map(async post => {
        const authorData = await getPersonWithUser(ctx, post.authorId);

        // Get reply count
        const replies = await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .collect();

        return {
          id: post._id,
          title: post.title,
          content: post.content,
          createdAt: post._creationTime,
          editedAt: post.editedAt ?? null,
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
          replyCount: replies.length,
        };
      })
    );

    return {
      posts: postsWithAuthors.filter(p => p.author !== null),
    };
  },
});

export const getPostDetail = internalQuery({
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

    // Get author data
    const authorData = await getPersonWithUser(ctx, post.authorId);

    // Get replies
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .order('asc')
      .collect();

    const repliesWithAuthors = await Promise.all(
      replies.map(async reply => {
        const replyAuthorData = await getPersonWithUser(ctx, reply.authorId);
        return {
          id: reply._id,
          text: reply.text,
          createdAt: reply._creationTime,
          updatedAt: reply.updatedAt ?? null,
          author: replyAuthorData
            ? {
                id: replyAuthorData.person._id,
                user: {
                  id: replyAuthorData.user._id,
                  name: replyAuthorData.user.name ?? null,
                  email: replyAuthorData.user.email ?? null,
                  image: replyAuthorData.user.image ?? null,
                  username: replyAuthorData.user.username ?? null,
                },
              }
            : null,
        };
      })
    );

    return {
      id: post._id,
      title: post.title,
      content: post.content,
      createdAt: post._creationTime,
      editedAt: post.editedAt ?? null,
      eventId: post.eventId,
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
      replies: repliesWithAuthors.filter(r => r.author !== null),
    };
  },
});

export const createPost = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    membershipId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { eventId, personId, title, content }) => {
    const result = await createPostForPerson(ctx, personId as Id<'persons'>, {
      eventId: eventId as Id<'events'>,
      title,
      content,
    });
    return { postId: result.postId };
  },
});

export const updatePost = internalMutation({
  args: {
    personId: v.string(),
    postId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { postId, personId, title, content }) => {
    await updatePostForPerson(ctx, personId as Id<'persons'>, {
      postId: postId as Id<'posts'>,
      title,
      content,
    });
    // Return updated post
    const updatedPost = await ctx.db.get(postId as Id<'posts'>);
    const authorData = updatedPost
      ? await getPersonWithUser(ctx, updatedPost.authorId)
      : null;

    // Get replies
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId as Id<'posts'>))
      .order('asc')
      .collect();

    const repliesWithAuthors = await Promise.all(
      replies.map(async reply => {
        const replyAuthorData = await getPersonWithUser(ctx, reply.authorId);
        return {
          id: reply._id,
          text: reply.text,
          createdAt: reply._creationTime,
          updatedAt: reply.updatedAt ?? null,
          author: replyAuthorData
            ? {
                id: replyAuthorData.person._id,
                user: {
                  id: replyAuthorData.user._id,
                  name: replyAuthorData.user.name ?? null,
                  email: replyAuthorData.user.email ?? null,
                  image: replyAuthorData.user.image ?? null,
                  username: replyAuthorData.user.username ?? null,
                },
              }
            : null,
        };
      })
    );

    return {
      id: updatedPost!._id,
      title: updatedPost!.title,
      content: updatedPost!.content,
      createdAt: updatedPost!._creationTime,
      editedAt: updatedPost!.editedAt ?? null,
      eventId: updatedPost!.eventId,
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
      replies: repliesWithAuthors.filter(r => r.author !== null),
    };
  },
});

export const deletePost = internalMutation({
  args: {
    personId: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, { postId, personId }) => {
    return deletePostForPerson(ctx, personId as Id<'persons'>, {
      postId: postId as Id<'posts'>,
    });
  },
});

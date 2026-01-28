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
  handler: async (ctx, { eventId, personId, membershipId, title, content }) => {
    const postId = await ctx.db.insert('posts', {
      title: title.trim(),
      content: content.trim(),
      authorId: personId as Id<'persons'>,
      eventId: eventId as Id<'events'>,
      membershipId: membershipId as Id<'memberships'>,
    });

    return { postId };
  },
});

export const updatePost = internalMutation({
  args: {
    postId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { postId, title, content }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (!post) {
      throw new Error('Post not found');
    }

    const now = Date.now();
    const updateData: Record<string, unknown> = {
      editedAt: now,
      updatedAt: now,
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (content !== undefined) {
      updateData.content = content.trim();
    }

    await ctx.db.patch(postId as Id<'posts'>, updateData);

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
    postId: v.string(),
  },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (!post) {
      throw new Error('Post not found');
    }

    // Delete all replies
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId as Id<'posts'>))
      .collect();

    for (const reply of replies) {
      // Delete reply attachments
      const attachments = await ctx.db
        .query('attachments')
        .withIndex('by_reply', q => q.eq('replyId', reply._id))
        .collect();
      for (const attachment of attachments) {
        await ctx.storage.delete(attachment.storageId);
        await ctx.db.delete(attachment._id);
      }
      await ctx.db.delete(reply._id);
    }

    // Delete post attachments
    const postAttachments = await ctx.db
      .query('attachments')
      .withIndex('by_post', q => q.eq('postId', postId as Id<'posts'>))
      .collect();
    for (const attachment of postAttachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
    }

    // Delete notifications
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_post', q => q.eq('postId', postId as Id<'posts'>))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
    }

    // Delete the post
    await ctx.db.delete(postId as Id<'posts'>);

    return { success: true };
  },
});

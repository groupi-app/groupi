import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventMembership, hasEventRole } from '../auth';
import {
  notifyEventMembers,
  notifyPerson,
  notifyThreadParticipants,
} from '../lib/notifications';
import { Doc } from '../_generated/dataModel';

/**
 * Posts mutations for the Convex backend
 *
 * These functions handle post creation, updates, and deletion
 * with proper authentication and authorization checks.
 */

/**
 * Create a new post in an event
 */
export const createPost = mutation({
  args: {
    eventId: v.id('events'),
    title: v.string(),
    content: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, title, content }) => {
    // Require authentication and event membership
    const { person } = await requireAuth(ctx);
    const membership = await requireEventMembership(ctx, eventId);

    // Validate input
    if (!title.trim()) {
      throw new Error('Post title is required');
    }
    if (!content.trim()) {
      throw new Error('Post content is required');
    }

    // Create the post
    const postId = await ctx.db.insert('posts', {
      title: title.trim(),
      content: content.trim(),
      authorId: person._id,
      eventId: eventId,
      membershipId: membership._id,
      editedAt: Date.now(),
    });

    // Get the created post with populated data
    const post = await ctx.db.get(postId);

    // Notify all event members about the new post
    await notifyEventMembers(ctx, {
      eventId,
      type: 'NEW_POST',
      authorId: person._id,
      postId,
    });

    return { postId, post };
  },
});

/**
 * Update an existing post
 */
export const updatePost = mutation({
  args: {
    postId: v.id('posts'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId, title, content }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get the post
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user can edit this post
    // User can edit if they are the author OR have moderator/organizer role in the event
    const isAuthor = post.authorId === person._id;
    const hasModeratorRole = await hasEventRole(ctx, post.eventId, 'MODERATOR');

    if (!isAuthor && !hasModeratorRole) {
      throw new Error("You don't have permission to edit this post");
    }

    // Prepare update data
    const updateData: Partial<Doc<'posts'>> = {
      editedAt: Date.now(),
    };

    if (title !== undefined) {
      if (!title.trim()) {
        throw new Error('Post title cannot be empty');
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        throw new Error('Post content cannot be empty');
      }
      updateData.content = content.trim();
    }

    // Update the post
    await ctx.db.patch(postId, updateData);

    // Get the updated post
    const updatedPost = await ctx.db.get(postId);

    // If someone other than the author edited, notify the author
    if (!isAuthor && post.authorId) {
      await notifyPerson(ctx, {
        personId: post.authorId,
        type: 'EVENT_EDITED', // Reusing EVENT_EDITED for post edits by moderators
        authorId: person._id,
        eventId: post.eventId,
        postId,
      });
    }

    return { post: updatedPost };
  },
});

/**
 * Delete a post
 */
export const deletePost = mutation({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get the post
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user can delete this post
    // User can delete if they are the author OR have moderator/organizer role in the event
    const isAuthor = post.authorId === person._id;
    const hasModeratorRole = await hasEventRole(ctx, post.eventId, 'MODERATOR');

    if (!isAuthor && !hasModeratorRole) {
      throw new Error("You don't have permission to delete this post");
    }

    // Delete all replies first
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete any notifications related to this post
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Delete the post
    await ctx.db.delete(postId);

    return { success: true };
  },
});

/**
 * Create a reply to a post
 */
export const createReply = mutation({
  args: {
    postId: v.id('posts'),
    text: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId, text }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get the post
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Require event membership
    const membership = await requireEventMembership(ctx, post.eventId);

    // Validate input
    if (!text.trim()) {
      throw new Error('Reply text is required');
    }

    // Create the reply
    const replyId = await ctx.db.insert('replies', {
      text: text.trim(),
      authorId: person._id,
      postId: postId,
      membershipId: membership._id,
    });

    // Get the created reply
    const reply = await ctx.db.get(replyId);

    // Notify thread participants (post author + other reply authors)
    // This uses presence tracking to skip users actively viewing the thread
    await notifyThreadParticipants(ctx, {
      postId: post._id,
      eventId: post.eventId,
      postAuthorId: post.authorId,
      replyAuthorId: person._id,
    });

    return { replyId, reply };
  },
});

/**
 * Update a reply
 */
export const updateReply = mutation({
  args: {
    replyId: v.id('replies'),
    text: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { replyId, text }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get the reply
    const reply = await ctx.db.get(replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }

    // Get the post to check event permissions
    const post = await ctx.db.get(reply.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user can edit this reply
    // User can edit if they are the author OR have moderator/organizer role in the event
    const isAuthor = reply.authorId === person._id;
    const hasModeratorRole = await hasEventRole(ctx, post.eventId, 'MODERATOR');

    if (!isAuthor && !hasModeratorRole) {
      throw new Error("You don't have permission to edit this reply");
    }

    // Validate input
    if (!text.trim()) {
      throw new Error('Reply text cannot be empty');
    }

    // Update the reply
    await ctx.db.patch(replyId, {
      text: text.trim(),
    });

    // Get the updated reply
    const updatedReply = await ctx.db.get(replyId);

    return { reply: updatedReply };
  },
});

/**
 * Delete a reply
 */
export const deleteReply = mutation({
  args: {
    replyId: v.id('replies'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { replyId }) => {
    // Require authentication
    const { person } = await requireAuth(ctx);

    // Get the reply
    const reply = await ctx.db.get(replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }

    // Get the post to check event permissions
    const post = await ctx.db.get(reply.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user can delete this reply
    // User can delete if they are the author OR have moderator/organizer role in the event
    const isAuthor = reply.authorId === person._id;
    const hasModeratorRole = await hasEventRole(ctx, post.eventId, 'MODERATOR');

    if (!isAuthor && !hasModeratorRole) {
      throw new Error("You don't have permission to delete this reply");
    }

    // Note: Notifications are tied to posts, not individual replies.
    // No notification cleanup needed for reply deletion.

    // Delete the reply
    await ctx.db.delete(replyId);

    return { success: true };
  },
});

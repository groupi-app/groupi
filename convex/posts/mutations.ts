import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventMembership, hasEventRole } from '../auth';
import {
  notifyEventMembers,
  notifyPerson,
  notifyMentionedUsers,
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
    // Note: Don't set editedAt on creation - only set it when editing
    // This prevents the "edited" indicator from showing on new posts
    const postId = await ctx.db.insert('posts', {
      title: title.trim(),
      content: content.trim(),
      authorId: person._id,
      eventId: eventId,
      membershipId: membership._id,
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

    // Notify mentioned users (separate from general post notification)
    await notifyMentionedUsers(ctx, {
      content,
      authorId: person._id,
      eventId,
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
    const now = Date.now();
    const updateData: Partial<Doc<'posts'>> = {
      editedAt: now,
      updatedAt: now,
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

    // Delete all replies and their attachments first
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    for (const reply of replies) {
      // Delete reply attachments and storage files
      const replyAttachments = await ctx.db
        .query('attachments')
        .withIndex('by_reply', q => q.eq('replyId', reply._id))
        .collect();

      for (const attachment of replyAttachments) {
        await ctx.storage.delete(attachment.storageId);
        await ctx.db.delete(attachment._id);
      }

      await ctx.db.delete(reply._id);
    }

    // Delete post attachments and storage files
    const postAttachments = await ctx.db
      .query('attachments')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    for (const attachment of postAttachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
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

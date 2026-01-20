import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { notifyThreadParticipants } from '../lib/notifications';

/**
 * Replies mutations for the Convex backend
 *
 * These functions handle reply creation and modification with proper authentication.
 */

/**
 * Create a new reply to a post
 */
export const createReply = mutation({
  args: {
    postId: v.id('posts'),
    text: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId, text }) => {
    const { person } = await requireAuth(ctx);

    // Get the post
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Verify user is a member of the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You must be a member of this event to reply');
    }

    // Create the reply
    const replyId = await ctx.db.insert('replies', {
      postId,
      text,
      authorId: person._id,
      membershipId: membership._id,
      updatedAt: Date.now(),
    });

    // Notify post author and other reply participants
    await notifyThreadParticipants(ctx, {
      postId,
      eventId: post.eventId,
      postAuthorId: post.authorId,
      replyAuthorId: person._id,
    });

    return { replyId };
  },
});

/**
 * Update an existing reply
 */
export const updateReply = mutation({
  args: {
    replyId: v.id('replies'),
    text: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { replyId, text }) => {
    const { person } = await requireAuth(ctx);

    // Get the reply
    const reply = await ctx.db.get(replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }

    // Verify ownership
    if (reply.authorId !== person._id) {
      throw new Error('You can only edit your own replies');
    }

    // Update the reply with updatedAt timestamp
    await ctx.db.patch(replyId, { text, updatedAt: Date.now() });

    return { success: true };
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
    const { person } = await requireAuth(ctx);

    // Get the reply
    const reply = await ctx.db.get(replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }

    // Get the post to check event membership
    const post = await ctx.db.get(reply.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user is author or moderator/organizer
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    const canDelete =
      reply.authorId === person._id ||
      membership.role === 'ORGANIZER' ||
      membership.role === 'MODERATOR';

    if (!canDelete) {
      throw new Error("You don't have permission to delete this reply");
    }

    // Delete reply attachments and storage files
    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_reply', q => q.eq('replyId', replyId))
      .collect();

    for (const attachment of attachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
    }

    await ctx.db.delete(replyId);
    return { success: true };
  },
});

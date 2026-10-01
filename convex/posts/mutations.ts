import { hasDiscussionText } from '../../packages/shared/src/utils/discussion-content';
import type { Id } from '../_generated/dataModel';
import { validateContent, validateTitle } from '../lib/discussionContent';
import { requireDiscussionRole } from '../lib/discussionAccess';
import { resolveEventPermissions } from '../auth';
import { mutation, type MutationCtx } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth } from '../auth';
import {
  notifyEventMembers,
  notifyPerson,
  notifyMentionedUsers,
} from '../lib/notifications';
import { Doc } from '../_generated/dataModel';
import {
  type AttachmentInput,
  attachmentInputValidator,
  createAttachmentsForParent,
  deleteAttachmentsForParent,
} from '../attachments/model';

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
    attachments: v.optional(v.array(attachmentInputValidator)),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createPostForPerson(ctx, person._id, args);
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
    attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
    attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updatePostForPerson(ctx, person._id, args);
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
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return deletePostForPerson(ctx, person._id, args);
  },
});

export async function createPostForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    title,
    content,
    attachments = [],
  }: {
    eventId: Id<'events'>;
    title: string;
    content: string;
    attachments?: AttachmentInput[];
  }
) {
  const person = { _id: personId };
  const membership = await requireDiscussionRole(
    ctx,
    eventId,
    personId,
    'ATTENDEE'
  );
  const event = await ctx.db.get(eventId);
  await requireDiscussionRole(
    ctx,
    eventId,
    personId,
    resolveEventPermissions(event!).createPosts === 'EVERYONE'
      ? 'ATTENDEE'
      : (resolveEventPermissions(event!).createPosts as
          | 'ORGANIZER'
          | 'MODERATOR')
  );

  // Validate input
  title = validateTitle(title);
  content = await validateContent(ctx, personId, eventId, content, 3000);
  if (!hasDiscussionText(content) && !attachments.length)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Post content or attachment is required',
    });

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

  if (attachments.length > 0) {
    await createAttachmentsForParent(ctx, {
      attachments,
      postId,
      personId: person._id,
    });
  }

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
}
export async function updatePostForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    postId,
    title,
    content,
    attachmentsToAdd = [],
    attachmentIdsToDelete = [],
  }: {
    postId: Id<'posts'>;
    title?: string;
    content?: string;
    attachmentsToAdd?: AttachmentInput[];
    attachmentIdsToDelete?: Id<'attachments'>[];
  }
) {
  // Require authentication
  const person = { _id: personId };

  // Get the post
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  // Check if user can edit this post
  // User can edit if they are the author OR have moderator/organizer role in the event
  const isAuthor = post.authorId === person._id;
  const hasModeratorRole =
    (await requireDiscussionRole(ctx, post.eventId, personId, 'ATTENDEE'))
      .role !== 'ATTENDEE';

  if (!isAuthor && !hasModeratorRole) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: "You don't have permission to edit this post",
    });
  }

  // Prepare update data
  const now = Date.now();
  const updateData: Partial<Doc<'posts'>> = {
    editedAt: now,
    updatedAt: now,
  };

  if (title !== undefined) {
    if (!title.trim()) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Post title cannot be empty',
      });
    }
    updateData.title = validateTitle(title, post.title);
  }

  if (content !== undefined) {
    updateData.content = await validateContent(
      ctx,
      personId,
      post.eventId,
      content,
      3000,
      post.content
    );
  }

  await deleteAttachmentsForParent(ctx, {
    attachmentIds: attachmentIdsToDelete,
    postId,
    personId: person._id,
  });

  if (attachmentsToAdd.length > 0) {
    await createAttachmentsForParent(ctx, {
      attachments: attachmentsToAdd,
      postId,
      personId: person._id,
    });
  }

  const remainingAttachment = await ctx.db
    .query('attachments')
    .withIndex('by_post', q => q.eq('postId', postId))
    .first();
  if (
    !hasDiscussionText(updateData.content ?? post.content) &&
    !remainingAttachment
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Post content or an attachment is required',
    });

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
}
export async function deletePostForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { postId }: { postId: Id<'posts'> }
) {
  // Require authentication
  const person = { _id: personId };

  // Get the post
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  // Check if user can delete this post
  // User can delete if they are the author OR have moderator/organizer role in the event
  const isAuthor = post.authorId === person._id;
  const hasModeratorRole =
    (await requireDiscussionRole(ctx, post.eventId, personId, 'ATTENDEE'))
      .role !== 'ATTENDEE';

  if (!isAuthor && !hasModeratorRole) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: "You don't have permission to delete this post",
    });
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
}

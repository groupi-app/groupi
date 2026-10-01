import { hasDiscussionText } from '../../packages/shared/src/utils/discussion-content';
import type { Id } from '../_generated/dataModel';
import { validateContent } from '../lib/discussionContent';
import { requireDiscussionRole } from '../lib/discussionAccess';
import { mutation, type MutationCtx } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth } from '../auth';
import {
  notifyThreadParticipants,
  notifyMentionedUsers,
} from '../lib/notifications';
import {
  type AttachmentInput,
  attachmentInputValidator,
  createAttachmentsForParent,
  deleteAttachmentsForParent,
} from '../attachments/model';

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
    attachments: v.optional(v.array(attachmentInputValidator)),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ replyId: v.id('replies') }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createReplyForPerson(ctx, person._id, args);
  },
});

/**
 * Update an existing reply
 */
export const updateReply = mutation({
  args: {
    replyId: v.id('replies'),
    text: v.string(),
    attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
    attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updateReplyForPerson(ctx, person._id, args);
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
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return deleteReplyForPerson(ctx, person._id, args);
  },
});

export async function createReplyForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    postId,
    text,
    attachments = [],
  }: { postId: Id<'posts'>; text: string; attachments?: AttachmentInput[] }
) {
  const person = { _id: personId };

  // Get the post
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  // Verify user is a member of the event
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', post.eventId)
    )
    .first();

  if (!membership) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You must be a member of this event to reply',
    });
  }

  const normalizedText = await validateContent(
    ctx,
    personId,
    post.eventId,
    text,
    5000
  );
  if (!hasDiscussionText(normalizedText) && attachments.length === 0) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Reply text or an attachment is required',
    });
  }

  // Create the reply
  // Note: Don't set updatedAt on creation - only set it when editing
  // This prevents the "edited" indicator from showing on new replies
  const replyId = await ctx.db.insert('replies', {
    postId,
    text: normalizedText,
    authorId: person._id,
    membershipId: membership._id,
  });

  if (attachments.length > 0) {
    await createAttachmentsForParent(ctx, {
      attachments,
      replyId,
      personId: person._id,
    });
  }

  // Notify post author and other reply participants
  await notifyThreadParticipants(ctx, {
    postId,
    eventId: post.eventId,
    postAuthorId: post.authorId,
    replyAuthorId: person._id,
  });

  // Notify mentioned users (separate from thread participant notification)
  await notifyMentionedUsers(ctx, {
    content: normalizedText,
    authorId: person._id,
    eventId: post.eventId,
    postId,
  });

  return { replyId };
}
export async function updateReplyForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    replyId,
    text,
    attachmentsToAdd = [],
    attachmentIdsToDelete = [],
  }: {
    replyId: Id<'replies'>;
    text?: string;
    attachmentsToAdd?: AttachmentInput[];
    attachmentIdsToDelete?: Id<'attachments'>[];
  }
) {
  const person = { _id: personId };

  // Get the reply
  const reply = await ctx.db.get(replyId);
  if (!reply) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Reply not found' });
  }

  // Get the post to check event permissions
  const post = await ctx.db.get(reply.postId);
  if (!post) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  // Check if user can edit this reply
  // User can edit if they are the author OR have moderator/organizer role
  const isAuthor = reply.authorId === person._id;
  const hasModeratorRole =
    (await requireDiscussionRole(ctx, post.eventId, personId, 'ATTENDEE'))
      .role !== 'ATTENDEE';

  if (!isAuthor && !hasModeratorRole) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: "You don't have permission to edit this reply",
    });
  }

  await deleteAttachmentsForParent(ctx, {
    attachmentIds: attachmentIdsToDelete,
    replyId,
    personId: person._id,
  });

  if (attachmentsToAdd.length > 0) {
    await createAttachmentsForParent(ctx, {
      attachments: attachmentsToAdd,
      replyId,
      personId: person._id,
    });
  }

  const remainingAttachment = await ctx.db
    .query('attachments')
    .withIndex('by_reply', q => q.eq('replyId', replyId))
    .first();
  text =
    text === undefined
      ? reply.text
      : await validateContent(
          ctx,
          personId,
          post.eventId,
          text,
          5000,
          reply.text
        );
  if (!hasDiscussionText(text) && !remainingAttachment) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Reply text or an attachment is required',
    });
  }

  // Update the reply with updatedAt timestamp
  await ctx.db.patch(replyId, { text: text.trim(), updatedAt: Date.now() });

  return { reply: await ctx.db.get(replyId) };
}
export async function deleteReplyForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { replyId }: { replyId: Id<'replies'> }
) {
  const person = { _id: personId };

  // Get the reply
  const reply = await ctx.db.get(replyId);
  if (!reply) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Reply not found' });
  }

  // Get the post to check event membership
  const post = await ctx.db.get(reply.postId);
  if (!post) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  // Check if user is author or moderator/organizer
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', post.eventId)
    )
    .first();

  if (!membership) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this event',
    });
  }

  const canDelete =
    reply.authorId === person._id ||
    membership.role === 'ORGANIZER' ||
    membership.role === 'MODERATOR';

  if (!canDelete) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: "You don't have permission to delete this reply",
    });
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
}

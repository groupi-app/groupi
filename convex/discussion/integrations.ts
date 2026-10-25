import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';
import { validateContent, validateTitle } from '../lib/discussionContent';
import { hasDiscussionText } from '../../packages/shared/src/utils/discussion-content';
import { notifyEventMembers } from '../lib/notifications';
import { denied } from '../authorization/model';
/** Integration authors are principals, never the sponsoring member. */
export async function writeIntegrationContent(
  ctx: MutationCtx,
  args: {
    principalId: Id<'authorizationPrincipals'>;
    sponsorPersonId: Id<'persons'>;
    eventId: Id<'events'>;
    kind: 'posts' | 'replies';
    operation: 'create' | 'edit' | 'delete';
    postId?: Id<'posts'>;
    replyId?: Id<'replies'>;
    title?: string;
    content?: string;
    text?: string;
    hasAttachments?: boolean;
  }
) {
  const principal = await ctx.db.get(args.principalId);
  if (
    !principal ||
    principal.kind !== 'integration' ||
    principal.ownerPersonId !== args.sponsorPersonId
  )
    throw denied();
  const now = Date.now();
  if (args.operation === 'create') {
    if (args.kind === 'posts') {
      const title = validateTitle(args.title ?? '');
      const content = await validateContent(
        ctx,
        args.sponsorPersonId,
        args.eventId,
        args.content ?? '',
        3000
      );
      if (!hasDiscussionText(content) && !args.hasAttachments)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Post content is required.',
        });
      const postId = await ctx.db.insert('posts', {
        eventId: args.eventId,
        title,
        content,
        authorId: principal._id,
        updatedAt: now,
      });
      await notifyEventMembers(ctx, {
        eventId: args.eventId,
        type: 'NEW_POST',
        postId,
      });
      return { postId };
    }
    const post = args.postId ? await ctx.db.get(args.postId) : null;
    if (!post || post.eventId !== args.eventId) throw denied();
    const text = await validateContent(
      ctx,
      args.sponsorPersonId,
      args.eventId,
      args.text ?? '',
      3000
    );
    if (!hasDiscussionText(text) && !args.hasAttachments)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Reply content is required.',
      });
    const replyId = await ctx.db.insert('replies', {
      postId: post._id,
      text,
      authorId: principal._id,
      updatedAt: now,
    });
    await notifyEventMembers(ctx, {
      eventId: args.eventId,
      type: 'NEW_REPLY',
      postId: post._id,
    });
    return { replyId };
  }
  if (args.kind === 'posts') {
    const post = args.postId ? await ctx.db.get(args.postId) : null;
    if (
      !post ||
      post.eventId !== args.eventId ||
      post.authorId !== principal._id
    )
      throw denied(
        'Integrations may change only their own discussion content.'
      );
    if (args.operation === 'edit') {
      const title =
        args.title === undefined
          ? post.title
          : validateTitle(args.title, post.title);
      const content =
        args.content === undefined
          ? post.content
          : await validateContent(
              ctx,
              args.sponsorPersonId,
              args.eventId,
              args.content,
              3000,
              post.content
            );
      if (!hasDiscussionText(content) && !args.hasAttachments)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Post content is required.',
        });
      await ctx.db.patch(post._id, {
        title,
        content,
        editedAt: now,
        updatedAt: now,
      });
      return { postId: post._id };
    }
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .collect();
    for (const reply of replies) {
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
    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .collect();
    for (const attachment of attachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
    }
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .collect();
    for (const notification of notifications)
      await ctx.db.delete(notification._id);
    await ctx.db.delete(post._id);
    return { postId: post._id };
  }
  const reply = args.replyId ? await ctx.db.get(args.replyId) : null;
  const post = reply ? await ctx.db.get(reply.postId) : null;
  if (
    !reply ||
    !post ||
    post.eventId !== args.eventId ||
    reply.authorId !== principal._id
  )
    throw denied('Integrations may change only their own discussion content.');
  if (args.operation === 'edit') {
    const text =
      args.text === undefined
        ? reply.text
        : await validateContent(
            ctx,
            args.sponsorPersonId,
            args.eventId,
            args.text,
            3000,
            reply.text
          );
    if (!hasDiscussionText(text) && !args.hasAttachments)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Reply content is required.',
      });
    await ctx.db.patch(reply._id, { text, updatedAt: now });
    return { replyId: reply._id };
  }
  const attachments = await ctx.db
    .query('attachments')
    .withIndex('by_reply', q => q.eq('replyId', reply._id))
    .collect();
  for (const attachment of attachments) {
    await ctx.storage.delete(attachment.storageId);
    await ctx.db.delete(attachment._id);
  }
  await ctx.db.delete(reply._id);
  return { replyId: reply._id };
}

import { requireDiscussionParent } from '../lib/discussionAccess';
import { v, ConvexError, type Infer } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

export const createReportArgs = v.object({
  targetType: v.union(
    v.literal('USER'),
    v.literal('EVENT'),
    v.literal('POST'),
    v.literal('REPLY')
  ),
  targetId: v.string(),
  reason: v.union(
    v.literal('SPAM'),
    v.literal('HARASSMENT'),
    v.literal('HATE_SPEECH'),
    v.literal('INAPPROPRIATE_CONTENT'),
    v.literal('IMPERSONATION'),
    v.literal('OTHER')
  ),
  details: v.optional(v.string()),
});

/** Shared report policy for an authenticated person, enforced in the write transaction. */
export async function createReportForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { targetType, targetId, reason, details }: Infer<typeof createReportArgs>
) {
  if (!(await ctx.db.get(personId))) throw new ConvexError('Account not found');
  // Prevent duplicate reports
  const existing = await ctx.db
    .query('reports')
    .withIndex('by_reporter_target', q =>
      q
        .eq('reporterId', personId)
        .eq('targetType', targetType)
        .eq('targetId', targetId)
    )
    .first();

  if (existing) {
    throw new ConvexError('You have already reported this content');
  }

  // Validate target exists and prevent self-reporting
  let contextEventId: Id<'events'> | undefined;
  let contextPostId: Id<'posts'> | undefined;

  if (targetType === 'USER') {
    const id = ctx.db.normalizeId('persons', targetId);
    const targetPerson = id ? await ctx.db.get(id) : null;
    if (!targetPerson) {
      throw new ConvexError('User not found');
    }
    if (targetPerson._id === personId) {
      throw new ConvexError('You cannot report yourself');
    }
  } else if (targetType === 'EVENT') {
    const id = ctx.db.normalizeId('events', targetId);
    const event = id ? await ctx.db.get(id) : null;
    if (!event) {
      throw new ConvexError('Event not found');
    }
    if (event.creatorId === personId) {
      throw new ConvexError('You cannot report your own event');
    }
    contextEventId = event._id;
  } else if (targetType === 'POST') {
    const id = ctx.db.normalizeId('posts', targetId);
    const post = id ? await ctx.db.get(id) : null;
    if (!post) {
      throw new ConvexError('Post not found');
    }
    if (post.authorId === personId) {
      throw new ConvexError('You cannot report your own post');
    }
    if (post.groupId) await requireDiscussionParent(ctx, post, personId);
    contextEventId = post.eventId;
    contextPostId = post._id;
  } else if (targetType === 'REPLY') {
    const id = ctx.db.normalizeId('replies', targetId);
    const reply = id ? await ctx.db.get(id) : null;
    if (!reply) {
      throw new ConvexError('Reply not found');
    }
    if (reply.authorId === personId) {
      throw new ConvexError('You cannot report your own reply');
    }
    const post = await ctx.db.get(reply.postId);
    if (post) {
      if (post.groupId) await requireDiscussionParent(ctx, post, personId);
      contextEventId = post.eventId;
      contextPostId = post._id;
    }
  }

  const reportId = await ctx.db.insert('reports', {
    reporterId: personId,
    targetType,
    targetId,
    reason,
    status: 'PENDING' as const,
    createdAt: Date.now(),
    ...(details?.trim() ? { details: details.trim().slice(0, 1000) } : {}),
    ...(contextEventId ? { contextEventId } : {}),
    ...(contextPostId ? { contextPostId } : {}),
  });
  return reportId;
}

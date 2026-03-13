import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { requireAuth } from '../auth';

/**
 * User-facing mutation to create a content report.
 *
 * Validates:
 * - Target exists
 * - User cannot report their own content
 * - One report per user per target (duplicate prevention)
 * - Populates contextEventId/contextPostId from parent chain
 */
export const createReport = mutation({
  args: {
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
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { targetType, targetId, reason, details }) => {
    const { person } = await requireAuth(ctx);

    // Prevent duplicate reports
    const existing = await ctx.db
      .query('reports')
      .withIndex('by_reporter_target', q =>
        q
          .eq('reporterId', person._id)
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
      const targetPerson = await ctx.db.get(targetId as Id<'persons'>);
      if (!targetPerson) {
        throw new ConvexError('User not found');
      }
      if (targetPerson._id === person._id) {
        throw new ConvexError('You cannot report yourself');
      }
    } else if (targetType === 'EVENT') {
      const event = await ctx.db.get(targetId as Id<'events'>);
      if (!event) {
        throw new ConvexError('Event not found');
      }
      if (event.creatorId === person._id) {
        throw new ConvexError('You cannot report your own event');
      }
      contextEventId = event._id;
    } else if (targetType === 'POST') {
      const post = await ctx.db.get(targetId as Id<'posts'>);
      if (!post) {
        throw new ConvexError('Post not found');
      }
      if (post.authorId === person._id) {
        throw new ConvexError('You cannot report your own post');
      }
      contextEventId = post.eventId;
      contextPostId = post._id;
    } else if (targetType === 'REPLY') {
      const reply = await ctx.db.get(targetId as Id<'replies'>);
      if (!reply) {
        throw new ConvexError('Reply not found');
      }
      if (reply.authorId === person._id) {
        throw new ConvexError('You cannot report your own reply');
      }
      const post = await ctx.db.get(reply.postId);
      if (post) {
        contextEventId = post.eventId;
        contextPostId = post._id;
      }
    }

    const reportId = await ctx.db.insert('reports', {
      reporterId: person._id,
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
  },
});

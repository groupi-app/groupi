import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';

/**
 * Internal queries and mutations for report routes
 */

export const createReport = internalMutation({
  args: {
    personId: v.string(),
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
  },
  handler: async (ctx, { personId, targetType, targetId, reason, details }) => {
    const now = Date.now();

    // Check for duplicate report from same person on same target
    const existingReport = await ctx.db
      .query('reports')
      .withIndex('by_reporter_target', q =>
        q
          .eq('reporterId', personId as Id<'persons'>)
          .eq('targetType', targetType)
          .eq('targetId', targetId)
      )
      .first();

    if (existingReport) {
      throw new Error('You have already reported this content');
    }

    const reportId = await ctx.db.insert('reports', {
      reporterId: personId as Id<'persons'>,
      targetType,
      targetId,
      reason,
      details: details?.trim(),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });

    return { reportId };
  },
});

export const listReports = internalQuery({
  args: {},
  handler: async ctx => {
    const reports = await ctx.db.query('reports').order('desc').collect();

    return {
      reports: reports.map(report => ({
        id: report._id,
        reporterId: report.reporterId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        details: report.details ?? null,
        status: report.status,
        createdAt: report.createdAt,
      })),
    };
  },
});

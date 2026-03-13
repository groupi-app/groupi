import { mutation, MutationCtx } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { getCurrentPerson, isAdmin } from '../auth';

/**
 * Admin mutations for managing reports.
 */

async function requireAdmin(ctx: MutationCtx) {
  const currentPerson = await getCurrentPerson(ctx);
  if (!currentPerson) {
    throw new ConvexError('Authentication required');
  }

  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new ConvexError('Admin privileges required');
  }

  return currentPerson;
}

/**
 * Dismiss a report (no action needed).
 */
export const dismissReport = mutation({
  args: {
    reportId: v.id('reports'),
    adminNote: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, adminNote }) => {
    const admin = await requireAdmin(ctx);

    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new ConvexError('Report not found');
    }

    await ctx.db.patch(reportId, {
      status: 'DISMISSED',
      resolvedById: admin._id,
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
      ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}),
    });
  },
});

/**
 * Mark a report as resolved with action taken.
 * The actual action (delete content, ban user) is performed
 * separately by the admin using existing admin mutations.
 */
export const resolveReport = mutation({
  args: {
    reportId: v.id('reports'),
    adminNote: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, adminNote }) => {
    const admin = await requireAdmin(ctx);

    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new ConvexError('Report not found');
    }

    await ctx.db.patch(reportId, {
      status: 'ACTION_TAKEN',
      resolvedById: admin._id,
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
      ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}),
    });
  },
});

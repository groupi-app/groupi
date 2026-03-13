import { query, QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import {
  getCurrentPerson,
  isAdmin,
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
} from '../auth';

/**
 * Admin queries and user-facing queries for the reports system.
 */

async function requireAdmin(ctx: QueryCtx) {
  const currentPerson = await getCurrentPerson(ctx);
  if (!currentPerson) {
    throw new Error('Authentication required');
  }

  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new Error('Admin privileges required');
  }

  return currentPerson;
}

type UserInfo = {
  name: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string | null;
} | null;

async function getUserInfo(ctx: QueryCtx, userId: string): Promise<UserInfo> {
  try {
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!user) return null;

    const extendedUser = user as ExtendedAuthUser;
    return {
      name: extendedUser.name || null,
      email: extendedUser.email,
      image: extendedUser.image || null,
      username: extendedUser.username || null,
      role: extendedUser.role || null,
    };
  } catch {
    return null;
  }
}

/**
 * Check if the current user has already reported a specific target.
 * Used in the UI to show "Already Reported" state.
 */
export const hasReported = query({
  args: {
    targetType: v.union(
      v.literal('USER'),
      v.literal('EVENT'),
      v.literal('POST'),
      v.literal('REPLY')
    ),
    targetId: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { targetType, targetId }) => {
    const person = await getCurrentPerson(ctx);
    if (!person) return false;

    const existing = await ctx.db
      .query('reports')
      .withIndex('by_reporter_target', q =>
        q
          .eq('reporterId', person._id)
          .eq('targetType', targetType)
          .eq('targetId', targetId)
      )
      .first();

    return existing !== null;
  },
});

/**
 * Get report statistics for the admin dashboard.
 */
export const getReportStats = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    await requireAdmin(ctx);

    const allReports = await ctx.db.query('reports').collect();

    const pending = allReports.filter(r => r.status === 'PENDING').length;
    const dismissed = allReports.filter(r => r.status === 'DISMISSED').length;
    const actionTaken = allReports.filter(
      r => r.status === 'ACTION_TAKEN'
    ).length;

    return {
      total: allReports.length,
      pending,
      dismissed,
      actionTaken,
    };
  },
});

/**
 * Get paginated list of reports for admin review.
 */
export const getReportsAdmin = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    statusFilter: v.optional(
      v.union(
        v.literal('ALL'),
        v.literal('PENDING'),
        v.literal('DISMISSED'),
        v.literal('ACTION_TAKEN')
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { cursor, limit = 50, search, statusFilter }) => {
    await requireAdmin(ctx);

    let allReports = await ctx.db.query('reports').order('desc').collect();

    // Filter by status
    if (statusFilter && statusFilter !== 'ALL') {
      allReports = allReports.filter(r => r.status === statusFilter);
    }

    // Filter by search (searches reason, details, target type)
    if (search?.trim()) {
      const searchLower = search.toLowerCase();
      allReports = allReports.filter(
        r =>
          r.reason.toLowerCase().includes(searchLower) ||
          r.targetType.toLowerCase().includes(searchLower) ||
          (r.details && r.details.toLowerCase().includes(searchLower))
      );
    }

    const startIndex = cursor ? parseInt(cursor) : 0;
    const reports = allReports.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allReports.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    // Enrich each report with reporter info and target preview
    const enrichedReports = await Promise.all(
      reports.map(async report => {
        // Get reporter info
        const reporter = await ctx.db.get(report.reporterId);
        const reporterUser = reporter
          ? await getUserInfo(ctx, reporter.userId)
          : null;

        // Get target preview based on type
        let targetPreview: {
          label: string;
          content?: string;
          authorName?: string;
          eventTitle?: string;
        } = { label: 'Unknown' };

        if (report.targetType === 'USER') {
          const targetPerson = await ctx.db.get(
            report.targetId as Id<'persons'>
          );
          if (targetPerson) {
            const targetUser = await getUserInfo(ctx, targetPerson.userId);
            targetPreview = {
              label: targetUser?.name || targetUser?.email || 'Unknown User',
              content: targetUser?.email,
            };
          }
        } else if (report.targetType === 'EVENT') {
          const event = await ctx.db.get(report.targetId as Id<'events'>);
          if (event) {
            targetPreview = {
              label: event.title,
              content: event.description || undefined,
            };
          }
        } else if (report.targetType === 'POST') {
          const post = await ctx.db.get(report.targetId as Id<'posts'>);
          if (post) {
            const author = await ctx.db.get(post.authorId);
            const authorUser = author
              ? await getUserInfo(ctx, author.userId)
              : null;
            const event = await ctx.db.get(post.eventId);
            targetPreview = {
              label: post.title,
              content: post.content.slice(0, 200),
              authorName: authorUser?.name || authorUser?.email || undefined,
              eventTitle: event?.title,
            };
          }
        } else if (report.targetType === 'REPLY') {
          const reply = await ctx.db.get(report.targetId as Id<'replies'>);
          if (reply) {
            const author = await ctx.db.get(reply.authorId);
            const authorUser = author
              ? await getUserInfo(ctx, author.userId)
              : null;
            const post = await ctx.db.get(reply.postId);
            const event = post ? await ctx.db.get(post.eventId) : null;
            targetPreview = {
              label: 'Reply',
              content: reply.text.slice(0, 200),
              authorName: authorUser?.name || authorUser?.email || undefined,
              eventTitle: event?.title,
            };
          }
        }

        // Get resolver info if resolved
        let resolverInfo: UserInfo = null;
        if (report.resolvedById) {
          const resolver = await ctx.db.get(report.resolvedById);
          resolverInfo = resolver
            ? await getUserInfo(ctx, resolver.userId)
            : null;
        }

        return {
          _id: report._id,
          reporterId: report.reporterId,
          targetType: report.targetType,
          targetId: report.targetId,
          contextEventId: report.contextEventId,
          contextPostId: report.contextPostId,
          reason: report.reason,
          details: report.details,
          status: report.status,
          resolvedAt: report.resolvedAt,
          adminNote: report.adminNote,
          createdAt: report.createdAt,
          reporter: reporterUser
            ? {
                name: reporterUser.name,
                email: reporterUser.email,
                image: reporterUser.image,
              }
            : null,
          targetPreview,
          resolver: resolverInfo
            ? {
                name: resolverInfo.name,
                email: resolverInfo.email,
              }
            : null,
        };
      })
    );

    return {
      reports: enrichedReports,
      totalCount: allReports.length,
      nextCursor,
      hasMore,
    };
  },
});

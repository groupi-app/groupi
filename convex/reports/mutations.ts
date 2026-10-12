import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { createReportArgs, createReportForPerson } from './writes';

/** Report existing content while preserving self-report and duplicate safeguards. */
export const createReport = mutation({
  args: { ...createReportArgs.fields, _traceId: v.optional(v.string()) },
  returns: v.id('reports'),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createReportForPerson(ctx, person._id, args);
  },
});

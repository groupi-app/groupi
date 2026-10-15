import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { createReportArgs, createReportForPerson } from './writes';

export const createReport = internalMutation({
  args: { ...createReportArgs.fields, personId: v.id('persons') },
  returns: v.object({ reportId: v.id('reports') }),
  handler: async (ctx, { personId, ...args }) => ({
    reportId: await createReportForPerson(ctx, personId, args),
  }),
});

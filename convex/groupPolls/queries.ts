import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { tool } from '../groupTools/contracts';
import { poll, managementPoll, votePage, historyPage } from './contracts';
import * as model from './model';
export const getPoll = query({
  args: { toolId: v.id('groupTools') },
  returns: poll,
  handler: async (ctx, args) =>
    model.get(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});
export const listPolls = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(tool),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) =>
    model.list(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts
    ),
});
export const getOwnHistory = query({
  args: { toolId: v.id('groupTools'), paginationOpts: paginationOptsValidator },
  returns: historyPage,
  handler: async (ctx, args) =>
    model.history(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.paginationOpts
    ),
});
export const listResults = query({
  args: { toolId: v.id('groupTools'), paginationOpts: paginationOptsValidator },
  returns: votePage,
  handler: async (ctx, args) =>
    model.results(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.paginationOpts
    ),
});

export const getPollForManagement = query({
  args: { toolId: v.id('groupTools') },
  returns: managementPoll,
  handler: async (ctx, args) =>
    model.management(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});

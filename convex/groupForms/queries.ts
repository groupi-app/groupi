import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { tool } from '../groupTools/contracts';
import { form, managementForm, responsePage, historyPage } from './contracts';
import * as model from './model';
export const getForm = query({
  args: { toolId: v.id('groupTools') },
  returns: form,
  handler: async (ctx, args) =>
    model.get(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});
export const listForms = query({
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
  returns: responsePage,
  handler: async (ctx, args) =>
    model.results(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.paginationOpts
    ),
});

export const getFormForManagement = query({
  args: { toolId: v.id('groupTools') },
  returns: managementForm,
  handler: async (ctx, args) =>
    model.management(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});

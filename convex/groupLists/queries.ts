import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { settings, entryPage, toolPage } from './contracts';
import * as model from './model';
export const getList = query({
  args: { toolId: v.id('groupTools') },
  returns: settings,
  handler: async (ctx, args) =>
    model.get(ctx, (await requireAuth(ctx)).person._id, args.toolId, false),
});
export const getListForManagement = query({
  args: { toolId: v.id('groupTools') },
  returns: settings,
  handler: async (ctx, args) =>
    model.get(ctx, (await requireAuth(ctx)).person._id, args.toolId, true),
});
export const listLists = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: toolPage,
  handler: async (ctx, args) =>
    model.list(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts
    ),
});
export const listEntries = query({
  args: { toolId: v.id('groupTools'), paginationOpts: paginationOptsValidator },
  returns: entryPage,
  handler: async (ctx, args) =>
    model.entries(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.paginationOpts,
      false
    ),
});
export const getOwnEntries = query({
  args: { toolId: v.id('groupTools'), paginationOpts: paginationOptsValidator },
  returns: entryPage,
  handler: async (ctx, args) =>
    model.entries(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.paginationOpts,
      true
    ),
});

import * as bring from './bring';
export const listBringClaims = query({
  args: {
    toolId: v.id('groupTools'),
    entryIds: v.array(v.id('groupListEntries')),
  },
  returns: v.array(bring.bringClaimSummary),
  handler: async (ctx, args) =>
    bring.claims(ctx, (await requireAuth(ctx)).person._id, args),
});

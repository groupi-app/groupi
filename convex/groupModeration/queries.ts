import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { bansPage } from './contracts';
import { listBans } from './model';
export const listGroupBans = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: bansPage,
  handler: async (ctx, args) =>
    listBans(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts
    ),
});

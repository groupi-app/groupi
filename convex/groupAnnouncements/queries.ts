import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { result } from './contracts';
import { get } from './model';
export const getAnnouncement = query({
  args: { groupId: v.id('groups'), requestId: v.string() },
  returns: v.union(result, v.null()),
  handler: async (ctx, args) =>
    get(ctx, (await requireAuth(ctx)).person._id, args.groupId, args.requestId),
});

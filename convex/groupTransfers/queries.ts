import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { result } from './contracts';
import { statusForPerson } from './model';
export const status = query({
  args: { groupId: v.id('groups') },
  returns: v.union(result, v.null()),
  handler: async (ctx, { groupId }) =>
    statusForPerson(ctx, (await requireAuth(ctx)).person._id, groupId),
});

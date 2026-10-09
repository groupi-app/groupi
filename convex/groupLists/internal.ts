import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
export const expireRequest = internalMutation({
  args: { id: v.id('groupListRequests') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (row && row.expiresAt <= Date.now()) await ctx.db.delete(id);
    return null;
  },
});

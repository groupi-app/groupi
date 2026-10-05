import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { creation } from './contracts';
import { setPolicy } from './policy';
export const configureFormPolicy = mutation({
  args: { groupId: v.id('groups'), enabled: v.boolean(), creation },
  returns: v.null(),
  handler: async (ctx, args) =>
    setPolicy(ctx, (await requireAuth(ctx)).person._id, args),
});

import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { creation } from './contracts';
import { readPolicy } from './policy';
export const getFormPolicy = query({
  args: { groupId: v.id('groups') },
  returns: v.object({
    groupId: v.id('groups'),
    kind: v.literal('FORM'),
    enabled: v.boolean(),
    creation,
    canConfigure: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const policy = await readPolicy(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId
    );
    return { ...policy, kind: 'FORM' as const };
  },
});

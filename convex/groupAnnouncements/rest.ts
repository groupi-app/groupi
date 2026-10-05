import { internalMutation, internalQuery } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { input, result } from './contracts';
import { send, get } from './model';
import type { QueryCtx, MutationCtx } from '../_generated/server';
function normalize(ctx: QueryCtx | MutationCtx, value: string) {
  const id = ctx.db.normalizeId('groups', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Group ID.',
    });
  return id;
}
export const create = internalMutation({
  args: { ...input, personId: v.id('persons'), groupId: v.string() },
  returns: result,
  handler: (ctx, { personId, ...args }) =>
    send(ctx, personId, { ...args, groupId: normalize(ctx, args.groupId) }),
});
export const status = internalQuery({
  args: {
    personId: v.id('persons'),
    groupId: v.string(),
    requestId: v.string(),
  },
  returns: v.union(result, v.null()),
  handler: (ctx, args) =>
    get(ctx, args.personId, normalize(ctx, args.groupId), args.requestId),
});

import { internalMutation, internalQuery } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
function groupId(ctx: QueryCtx | MutationCtx, value: string) {
  const id = ctx.db.normalizeId('groups', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Group ID.',
    });
  return id;
}
import { paginationOptsValidator } from 'convex/server';
import { identityInput, updateInput, group, page } from './contracts';
import * as model from './model';
export const create = internalMutation({
  args: { personId: v.id('persons'), ...identityInput },
  returns: v.id('groups'),
  handler: (ctx, { personId, ...args }) => model.create(ctx, personId, args),
});
export const update = internalMutation({
  args: { personId: v.id('persons'), ...updateInput, groupId: v.string() },
  returns: v.null(),
  handler: (ctx, { personId, ...args }) =>
    model.update(ctx, personId, {
      ...args,
      groupId: groupId(ctx, args.groupId),
    }),
});
export const remove = internalMutation({
  args: { personId: v.id('persons'), groupId: v.string() },
  returns: v.null(),
  handler: (ctx, args) =>
    model.remove(ctx, args.personId, groupId(ctx, args.groupId)),
});
export const get = internalQuery({
  args: { personId: v.id('persons'), groupId: v.string() },
  returns: v.union(group, v.null()),
  handler: (ctx, args) =>
    model.detail(ctx, args.personId, groupId(ctx, args.groupId)),
});
export const list = internalQuery({
  args: { personId: v.id('persons'), paginationOpts: paginationOptsValidator },
  returns: page,
  handler: (ctx, args) => model.list(ctx, args.personId, args.paginationOpts),
});

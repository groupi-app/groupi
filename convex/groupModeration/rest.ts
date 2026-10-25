import {
  internalMutation,
  internalQuery,
  type QueryCtx,
  type MutationCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type { TableNames } from '../_generated/dataModel';
import * as model from './model';
import { bansPage } from './contracts';
function id<Table extends TableNames>(
  ctx: MutationCtx | QueryCtx,
  table: Table,
  value: string
) {
  const result = ctx.db.normalizeId(table, value);
  if (!result)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid resource ID.',
    });
  return result;
}
const target = {
  actorId: v.id('persons'),
  groupId: v.string(),
  personId: v.string(),
};
export const role = internalMutation({
  args: {
    ...target,
    role: v.union(v.literal('MODERATOR'), v.literal('MEMBER')),
  },
  returns: v.object({
    role: v.union(v.literal('MODERATOR'), v.literal('MEMBER')),
  }),
  handler: (ctx, args) =>
    model.setRole(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'persons', args.personId),
      args.role
    ),
});
export const remove = internalMutation({
  args: target,
  returns: v.object({ removed: v.boolean() }),
  handler: (ctx, args) =>
    model.removeMember(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'persons', args.personId)
    ),
});
export const ban = internalMutation({
  args: target,
  returns: v.object({ banned: v.literal(true) }),
  handler: (ctx, args) =>
    model.ban(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'persons', args.personId)
    ),
});
export const lift = internalMutation({
  args: target,
  returns: v.object({ banned: v.literal(false) }),
  handler: (ctx, args) =>
    model.lift(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'persons', args.personId)
    ),
});
export const leave = internalMutation({
  args: { actorId: v.id('persons'), groupId: v.string() },
  returns: v.object({ left: v.boolean() }),
  handler: (ctx, args) =>
    model.leave(ctx, args.actorId, id(ctx, 'groups', args.groupId)),
});
export const list = internalQuery({
  args: {
    actorId: v.id('persons'),
    groupId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: bansPage,
  handler: (ctx, args) =>
    model.listBans(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      args.paginationOpts
    ),
});

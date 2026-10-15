import {
  internalQuery,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import type { TableNames } from '../_generated/dataModel';
import { result } from './contracts';
import { statusForPerson, offerForPerson, decideForPerson } from './model';
function id<Table extends TableNames>(
  ctx: QueryCtx | MutationCtx,
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
const actor = { groupId: v.string(), personId: v.id('persons') };
export const status = internalQuery({
  args: actor,
  returns: v.union(result, v.null()),
  handler: (ctx, args) =>
    statusForPerson(ctx, args.personId, id(ctx, 'groups', args.groupId)),
});
export const offer = internalMutation({
  args: { ...actor, recipientId: v.string() },
  returns: v.union(result, v.null()),
  handler: (ctx, args) =>
    offerForPerson(
      ctx,
      args.personId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'persons', args.recipientId)
    ),
});
export const decide = internalMutation({
  args: {
    ...actor,
    transferId: v.string(),
    decision: v.union(
      v.literal('ACCEPTED'),
      v.literal('DECLINED'),
      v.literal('CANCELLED')
    ),
  },
  returns: v.union(result, v.null()),
  handler: (ctx, args) =>
    decideForPerson(
      ctx,
      args.personId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'groupTransfers', args.transferId),
      args.decision
    ),
});

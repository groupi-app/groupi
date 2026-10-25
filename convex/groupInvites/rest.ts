import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type { TableNames } from '../_generated/dataModel';
import * as model from './model';
import * as contracts from './contracts';
function id<Table extends TableNames>(
  ctx: MutationCtx | QueryCtx,
  table: Table,
  value: string
) {
  const result = ctx.db.normalizeId(table, value);
  if (!result)
    throw new ConvexError({
      code: table === 'persons' ? 'RECIPIENT_UNAVAILABLE' : 'VALIDATION_ERROR',
      message:
        table === 'persons'
          ? 'This recipient or invitation is unavailable.'
          : 'Invalid resource ID.',
    });
  return result;
}
export const send = internalMutation({
  args: {
    personId: v.id('persons'),
    groupId: v.string(),
    inviteePersonId: v.string(),
  },
  returns: contracts.sent,
  handler: (ctx, args) =>
    model.send(
      ctx,
      args.personId,
      id(ctx, 'groups', args.groupId),
      id(ctx, 'persons', args.inviteePersonId)
    ),
});
export const accept = internalMutation({
  args: { personId: v.id('persons'), inviteId: v.string() },
  returns: contracts.accepted,
  handler: (ctx, args) =>
    model.accept(ctx, args.personId, id(ctx, 'groupInvites', args.inviteId)),
});
export const decline = internalMutation({
  args: { personId: v.id('persons'), inviteId: v.string() },
  returns: v.object({ status: v.literal('DECLINED') }),
  handler: (ctx, args) =>
    model.decline(ctx, args.personId, id(ctx, 'groupInvites', args.inviteId)),
});
export const cancel = internalMutation({
  args: { personId: v.id('persons'), inviteId: v.string() },
  returns: v.object({ status: v.literal('CANCELLED') }),
  handler: (ctx, args) =>
    model.cancel(ctx, args.personId, id(ctx, 'groupInvites', args.inviteId)),
});
export const list = internalQuery({
  args: {
    personId: v.id('persons'),
    groupId: v.optional(v.string()),
    status: v.optional(contracts.status),
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.page,
  handler: (ctx, args) =>
    model.listInvites(
      ctx,
      args.personId,
      args.paginationOpts,
      args.groupId ? id(ctx, 'groups', args.groupId) : undefined,
      args.status
    ),
});
export const members = internalQuery({
  args: {
    personId: v.id('persons'),
    groupId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.memberPage,
  handler: (ctx, args) =>
    model.roster(
      ctx,
      args.personId,
      id(ctx, 'groups', args.groupId),
      args.paginationOpts
    ),
});
export const policy = internalMutation({
  args: {
    personId: v.id('persons'),
    groupId: v.string(),
    invitationsEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: (ctx, args) =>
    model.policy(
      ctx,
      args.personId,
      id(ctx, 'groups', args.groupId),
      args.invitationsEnabled
    ),
});

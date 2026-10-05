import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import * as model from './model';
import * as contracts from './contracts';
export const sendGroupInvite = mutation({
  args: { groupId: v.id('groups'), inviteePersonId: v.id('persons') },
  returns: contracts.sent,
  handler: async (ctx, args) =>
    model.send(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.inviteePersonId
    ),
});
export const acceptGroupInvite = mutation({
  args: { inviteId: v.id('groupInvites') },
  returns: contracts.accepted,
  handler: async (ctx, args) =>
    model.accept(ctx, (await requireAuth(ctx)).person._id, args.inviteId),
});
export const declineGroupInvite = mutation({
  args: { inviteId: v.id('groupInvites') },
  returns: v.object({ status: v.literal('DECLINED') }),
  handler: async (ctx, args) =>
    model.decline(ctx, (await requireAuth(ctx)).person._id, args.inviteId),
});
export const cancelGroupInvite = mutation({
  args: { inviteId: v.id('groupInvites') },
  returns: v.object({ status: v.literal('CANCELLED') }),
  handler: async (ctx, args) =>
    model.cancel(ctx, (await requireAuth(ctx)).person._id, args.inviteId),
});

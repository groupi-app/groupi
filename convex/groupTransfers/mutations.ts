import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { result } from './contracts';
import { offerForPerson, decideForPerson } from './model';
const args = { groupId: v.id('groups'), transferId: v.id('groupTransfers') };
export const offer = mutation({
  args: { groupId: v.id('groups'), recipientId: v.id('persons') },
  returns: v.union(result, v.null()),
  handler: async (ctx, { groupId, recipientId }) =>
    offerForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      groupId,
      recipientId
    ),
});
export const accept = mutation({
  args,
  returns: v.union(result, v.null()),
  handler: async (ctx, { groupId, transferId }) =>
    decideForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      groupId,
      transferId,
      'ACCEPTED'
    ),
});
export const decline = mutation({
  args,
  returns: v.union(result, v.null()),
  handler: async (ctx, { groupId, transferId }) =>
    decideForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      groupId,
      transferId,
      'DECLINED'
    ),
});
export const cancel = mutation({
  args,
  returns: v.union(result, v.null()),
  handler: async (ctx, { groupId, transferId }) =>
    decideForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      groupId,
      transferId,
      'CANCELLED'
    ),
});

import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { result, offerForPerson, decideForPerson } from './model';
export const offer = mutation({
  args: { eventId: v.id('events'), recipientId: v.id('persons') },
  returns: v.union(result, v.null()),
  handler: async (ctx, { eventId, recipientId }) => {
    const { person } = await requireAuth(ctx);
    return offerForPerson(ctx, person._id, eventId, recipientId);
  },
});
const args = { eventId: v.id('events'), transferId: v.id('eventTransfers') };
export const accept = mutation({
  args,
  returns: v.union(result, v.null()),
  handler: async (ctx, { eventId, transferId }) => {
    const { person } = await requireAuth(ctx);
    return decideForPerson(ctx, person._id, eventId, transferId, 'ACCEPTED');
  },
});
export const decline = mutation({
  args,
  returns: v.union(result, v.null()),
  handler: async (ctx, { eventId, transferId }) => {
    const { person } = await requireAuth(ctx);
    return decideForPerson(ctx, person._id, eventId, transferId, 'DECLINED');
  },
});
export const cancel = mutation({
  args,
  returns: v.union(result, v.null()),
  handler: async (ctx, { eventId, transferId }) => {
    const { person } = await requireAuth(ctx);
    return decideForPerson(ctx, person._id, eventId, transferId, 'CANCELLED');
  },
});

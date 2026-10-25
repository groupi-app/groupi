import { mutation } from '../_generated/server';
import { requireAuth } from '../auth';
import { v } from 'convex/values';
import * as writes from './writes';

export const sendEventInvite = mutation({
  args: writes.sendEventInviteArgs,
  returns: v.object({
    inviteId: v.id('eventInvites'),
    status: v.literal('PENDING'),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.sendEventInviteForPerson(ctx, person._id, args);
  },
});

export const acceptEventInvite = mutation({
  args: writes.acceptEventInviteArgs,
  returns: v.object({
    success: v.boolean(),
    membershipId: v.id('memberships'),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.acceptEventInviteForPerson(ctx, person._id, args);
  },
});

export const declineEventInvite = mutation({
  args: writes.declineEventInviteArgs,
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.declineEventInviteForPerson(ctx, person._id, args);
  },
});

export const cancelEventInvite = mutation({
  args: writes.cancelEventInviteArgs,
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.cancelEventInviteForPerson(ctx, person._id, args);
  },
});

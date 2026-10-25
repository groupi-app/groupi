import { mutation } from '../_generated/server';
import { requireAuth } from '../auth';
import { v } from 'convex/values';
import * as writes from './writes';

export const createInvite = mutation({
  args: writes.createInviteArgs,
  returns: writes.inviteResultValidator,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.createInviteForPerson(ctx, person._id, args);
  },
});

export const updateInvite = mutation({
  args: writes.updateInviteArgs,
  returns: writes.inviteResultValidator,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.updateInviteForPerson(ctx, person._id, args);
  },
});

export const deleteInvites = mutation({
  args: writes.deleteInvitesArgs,
  returns: v.object({
    deletedCount: v.number(),
    deletedIds: v.array(v.id('invites')),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.deleteInvitesForPerson(ctx, person._id, args);
  },
});

export const acceptInvite = mutation({
  args: writes.acceptInviteArgs,
  returns: writes.acceptResultValidator,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.acceptInviteForPerson(ctx, person._id, args);
  },
});

export const createEmailInvites = mutation({
  args: writes.createEmailInvitesArgs,
  returns: v.object({
    createdCount: v.number(),
    inviteIds: v.array(v.id('invites')),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.createEmailInvitesForPerson(ctx, person._id, args);
  },
});

export const sendPendingEmailInvites = mutation({
  args: writes.sendPendingEmailInvitesArgs,
  returns: v.object({ sentCount: v.number() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return writes.sendPendingEmailInvitesForPerson(ctx, person._id, args);
  },
});

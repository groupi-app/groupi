import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth } from '../auth';
import {
  listDetail,
  deleteResult,
  sendResult,
  snapshotSendArgs,
  listSendArgs,
} from './contracts';
import { sendSnapshotForPerson, sendListForPerson } from './sending';
import {
  createListForPerson,
  updateListForPerson,
  deleteListForPerson,
} from './model';

export const createInviteList = mutation({
  args: { name: v.string(), personIds: v.array(v.id('persons')) },
  returns: listDetail,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createListForPerson(ctx, person._id, args);
  },
});

export const updateInviteList = mutation({
  args: {
    inviteListId: v.id('inviteLists'),
    name: v.optional(v.string()),
    personIds: v.optional(v.array(v.id('persons'))),
  },
  returns: listDetail,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updateListForPerson(ctx, person._id, args);
  },
});

export const deleteInviteList = mutation({
  args: { inviteListId: v.id('inviteLists') },
  returns: deleteResult,
  handler: async (ctx, { inviteListId }) => {
    const { person } = await requireAuth(ctx);
    return deleteListForPerson(ctx, person._id, inviteListId);
  },
});
export const sendInviteListRecipients = mutation({
  args: snapshotSendArgs,
  returns: sendResult,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return sendSnapshotForPerson(ctx, person._id, args);
  },
});
export const inviteListToEvent = mutation({
  args: listSendArgs,
  returns: sendResult,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return sendListForPerson(ctx, person._id, args);
  },
});

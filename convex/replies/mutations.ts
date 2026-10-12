import {
  createReplyArgs,
  updateReplyArgs,
  deleteReplyArgs,
  replyDocument,
} from './model';
import {
  createReplyForPerson,
  updateReplyForPerson,
  deleteReplyForPerson,
} from './writes';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

export const createReply = mutation({
  args: createReplyArgs.fields,
  returns: v.object({ replyId: v.id('replies') }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return createReplyForPerson(ctx, person._id, args);
  },
});

export const updateReply = mutation({
  args: updateReplyArgs.fields,
  returns: v.object({ reply: v.union(replyDocument, v.null()) }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return updateReplyForPerson(ctx, person._id, args);
  },
});

export const deleteReply = mutation({
  args: deleteReplyArgs.fields,
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return deleteReplyForPerson(ctx, person._id, args);
  },
});

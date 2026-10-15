import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { configInput, createInput } from './contracts';
import * as model from './model';
export const createPoll = mutation({
  args: createInput,
  returns: v.id('groupTools'),
  handler: async (ctx, args) =>
    model.create(ctx, (await requireAuth(ctx)).person._id, args),
});
export const configurePoll = mutation({
  args: { toolId: v.id('groupTools'), version: v.number(), ...configInput },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.configure(ctx, (await requireAuth(ctx)).person._id, args),
});
export const submitVote = mutation({
  args: {
    toolId: v.id('groupTools'),
    version: v.number(),
    expectedRevision: v.number(),
    selections: v.array(v.string()),
  },
  returns: v.object({ revision: v.number() }),
  handler: async (ctx, args) =>
    model.submit(ctx, (await requireAuth(ctx)).person._id, args),
});
export const removeVote = mutation({
  args: { toolId: v.id('groupTools'), expectedRevision: v.number() },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.removeVote(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.expectedRevision
    ),
});
export const deletePoll = mutation({
  args: { toolId: v.id('groupTools') },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.remove(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});
export const removeResult = mutation({
  args: { voteId: v.id('groupPollVotes'), expectedRevision: v.number() },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.moderate(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.voteId,
      args.expectedRevision
    ),
});

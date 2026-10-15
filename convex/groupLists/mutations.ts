import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { config, createInput, addResult } from './contracts';
import * as model from './model';
export const createList = mutation({
  args: createInput,
  returns: v.id('groupTools'),
  handler: async (ctx, args) =>
    model.create(ctx, (await requireAuth(ctx)).person._id, args),
});
export const configureList = mutation({
  args: { toolId: v.id('groupTools'), version: v.number(), ...config },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.configure(ctx, (await requireAuth(ctx)).person._id, args),
});
export const addEntry = mutation({
  args: {
    toolId: v.id('groupTools'),
    version: v.number(),
    requestId: v.string(),
    text: v.string(),
  },
  returns: addResult,
  handler: async (ctx, args) =>
    model.add(ctx, (await requireAuth(ctx)).person._id, args),
});
export const editEntry = mutation({
  args: {
    entryId: v.id('groupListEntries'),
    version: v.number(),
    expectedRevision: v.number(),
    text: v.string(),
    completed: v.boolean(),
  },
  returns: v.object({ revision: v.number() }),
  handler: async (ctx, args) =>
    model.edit(ctx, (await requireAuth(ctx)).person._id, args),
});
export const removeEntry = mutation({
  args: { entryId: v.id('groupListEntries'), expectedRevision: v.number() },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.removeEntry(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.entryId,
      args.expectedRevision
    ),
});
export const deleteList = mutation({
  args: { toolId: v.id('groupTools') },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.remove(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});

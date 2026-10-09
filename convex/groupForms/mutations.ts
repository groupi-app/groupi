import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { answersValidator } from '../eventApplications/contracts';
import { configInput, createInput } from './contracts';
import * as model from './model';
export const createForm = mutation({
  args: createInput,
  returns: v.id('groupTools'),
  handler: async (ctx, args) =>
    model.create(ctx, (await requireAuth(ctx)).person._id, args),
});
export const configureForm = mutation({
  args: { toolId: v.id('groupTools'), version: v.number(), ...configInput },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.configure(ctx, (await requireAuth(ctx)).person._id, args),
});
export const submitResponse = mutation({
  args: {
    toolId: v.id('groupTools'),
    version: v.number(),
    expectedRevision: v.number(),
    answers: answersValidator,
  },
  returns: v.object({ revision: v.number() }),
  handler: async (ctx, args) =>
    model.submit(ctx, (await requireAuth(ctx)).person._id, args),
});
export const removeResponse = mutation({
  args: { toolId: v.id('groupTools'), personId: v.optional(v.id('persons')) },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.removeResponse(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.toolId,
      args.personId
    ),
});
export const deleteForm = mutation({
  args: { toolId: v.id('groupTools') },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.remove(ctx, (await requireAuth(ctx)).person._id, args.toolId),
});
export const removeResult = mutation({
  args: { responseId: v.id('groupFormResponses') },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.removeResult(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.responseId
    ),
});

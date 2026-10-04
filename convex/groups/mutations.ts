import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { identityInput, updateInput } from './contracts';
import * as model from './model';
export const createGroup = mutation({
  args: identityInput,
  returns: v.id('groups'),
  handler: async (ctx, args) =>
    model.create(ctx, (await requireAuth(ctx)).person._id, args),
});
export const updateGroup = mutation({
  args: updateInput,
  returns: v.null(),
  handler: async (ctx, args) =>
    model.update(ctx, (await requireAuth(ctx)).person._id, args),
});
export const deleteGroup = mutation({
  args: { groupId: v.id('groups') },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.remove(ctx, (await requireAuth(ctx)).person._id, args.groupId),
});

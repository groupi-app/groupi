import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import * as model from './model';
const target = { groupId: v.id('groups'), personId: v.id('persons') };
export const setGroupMemberRole = mutation({
  args: {
    ...target,
    role: v.union(v.literal('MODERATOR'), v.literal('MEMBER')),
  },
  returns: v.object({
    role: v.union(v.literal('MODERATOR'), v.literal('MEMBER')),
  }),
  handler: async (ctx, args) =>
    model.setRole(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.personId,
      args.role
    ),
});
export const removeGroupMember = mutation({
  args: target,
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx, args) =>
    model.removeMember(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.personId
    ),
});
export const leaveGroup = mutation({
  args: { groupId: v.id('groups') },
  returns: v.object({ left: v.boolean() }),
  handler: async (ctx, args) =>
    model.leave(ctx, (await requireAuth(ctx)).person._id, args.groupId),
});

export const banGroupPerson = mutation({
  args: target,
  returns: v.object({ banned: v.literal(true) }),
  handler: async (ctx, args) =>
    model.ban(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.personId
    ),
});
export const liftGroupBan = mutation({
  args: target,
  returns: v.object({ banned: v.literal(false) }),
  handler: async (ctx, args) =>
    model.lift(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.personId
    ),
});

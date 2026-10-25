import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { target, result, sharingPolicy } from './contracts';
import * as model from './model';
export const shareEventWithGroup = mutation({
  args: target,
  returns: result,
  handler: async (ctx, args) =>
    model.share(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.eventId,
      args.groupId
    ),
});
export const withdrawGroupEventAudience = mutation({
  args: target,
  returns: result,
  handler: async (ctx, args) =>
    model.withdraw(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.eventId,
      args.groupId
    ),
});
export const configureGroupEventSharing = mutation({
  args: { groupId: v.id('groups'), policy: sharingPolicy },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.configure(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.policy
    ),
});
export const setEventFriendsAudience = mutation({
  args: { eventId: v.id('events'), enabled: v.boolean() },
  returns: v.object({ eventId: v.id('events'), friendsShared: v.boolean() }),
  handler: async (ctx, args) =>
    model.friends(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.eventId,
      args.enabled
    ),
});

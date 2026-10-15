import {
  internalQuery,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { audience, page, result, sharingPolicy } from './contracts';
import * as model from './model';
function group(ctx: QueryCtx | MutationCtx, value: string) {
  const id = ctx.db.normalizeId('groups', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Group ID.',
    });
  return id;
}
function event(ctx: QueryCtx | MutationCtx, value: string) {
  const id = ctx.db.normalizeId('events', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Event ID.',
    });
  return id;
}
const actor = { personId: v.id('persons') };
const target = { ...actor, groupId: v.string(), eventId: v.string() };
export const share = internalMutation({
  args: target,
  returns: result,
  handler: (ctx, a) =>
    model.share(ctx, a.personId, event(ctx, a.eventId), group(ctx, a.groupId)),
});
export const withdraw = internalMutation({
  args: target,
  returns: result,
  handler: (ctx, a) =>
    model.withdraw(
      ctx,
      a.personId,
      event(ctx, a.eventId),
      group(ctx, a.groupId)
    ),
});
export const configure = internalMutation({
  args: { ...actor, groupId: v.string(), policy: sharingPolicy },
  returns: v.null(),
  handler: (ctx, a) =>
    model.configure(ctx, a.personId, group(ctx, a.groupId), a.policy),
});
export const friends = internalMutation({
  args: { ...actor, eventId: v.string(), enabled: v.boolean() },
  returns: v.object({ eventId: v.id('events'), friendsShared: v.boolean() }),
  handler: (ctx, a) =>
    model.friends(ctx, a.personId, event(ctx, a.eventId), a.enabled),
});
export const get = internalQuery({
  args: { ...actor, eventId: v.string() },
  returns: audience,
  handler: (ctx, a) => model.audiences(ctx, a.personId, event(ctx, a.eventId)),
});
export const list = internalQuery({
  args: {
    ...actor,
    groupId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: page,
  handler: (ctx, a) =>
    model.list(ctx, a.personId, group(ctx, a.groupId), a.paginationOpts),
});

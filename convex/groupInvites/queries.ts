import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth, getCurrentPerson } from '../auth';
import * as model from './model';
import * as contracts from './contracts';
export const listMyGroupInvites = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(contracts.status),
  },
  returns: contracts.page,
  handler: async (ctx, args) =>
    model.listInvites(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.paginationOpts,
      undefined,
      args.status
    ),
});
export const listGroupInvites = query({
  args: {
    groupId: v.id('groups'),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contracts.status),
  },
  returns: contracts.page,
  handler: async (ctx, args) =>
    model.listInvites(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.paginationOpts,
      args.groupId,
      args.status
    ),
});
export const getMyGroupInviteForGroup = query({
  args: { groupId: v.id('groups') },
  returns: v.union(contracts.summary, v.null()),
  handler: async (ctx, args) => {
    const person = await getCurrentPerson(ctx);
    return person ? model.ownForGroup(ctx, person._id, args.groupId) : null;
  },
});

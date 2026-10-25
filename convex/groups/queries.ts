import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { getCurrentPerson, requireAuth } from '../auth';
import * as contracts from './contracts';
import * as model from './model';
export const listGroups = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: contracts.page,
  handler: async (ctx, args) =>
    model.list(ctx, (await requireAuth(ctx)).person._id, args.paginationOpts),
});
export const getGroup = query({
  args: { groupId: v.id('groups') },
  returns: v.union(contracts.group, v.null()),
  handler: async (ctx, args) => {
    const person = await getCurrentPerson(ctx);
    return person ? model.detail(ctx, person._id, args.groupId) : null;
  },
});
export const getGroupLanding = query({
  args: { groupId: v.id('groups') },
  returns: v.union(contracts.landing, v.null()),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    return group
      ? {
          groupId: group._id,
          name: group.name,
          description: group.description ?? null,
          image: group.image ?? null,
        }
      : null;
  },
});

import { memberPage } from '../groupInvites/contracts';
import { roster } from '../groupInvites/model';
export const listGroupMembers = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: memberPage,
  handler: async (ctx, args) =>
    roster(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts
    ),
});

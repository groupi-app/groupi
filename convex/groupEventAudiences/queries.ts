import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { audience, page } from './contracts';
import * as model from './model';
export const getEventAudiences = query({
  args: { eventId: v.id('events') },
  returns: audience,
  handler: async (ctx, args) =>
    model.audiences(ctx, (await requireAuth(ctx)).person._id, args.eventId),
});
export const listGroupSharedEvents = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: page,
  handler: async (ctx, args) =>
    model.list(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts
    ),
});

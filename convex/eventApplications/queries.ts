import {
  applicationFormValidator,
  applicationPageValidator,
  applicationReviewPageValidator,
} from './contracts';
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import * as model from './model';
export const getForm = query({
  returns: applicationFormValidator,
  args: { eventId: v.id('events') },
  handler: async (ctx, args) =>
    model.getForm(ctx, args.eventId, (await requireAuth(ctx)).person._id),
});
export const history = query({
  returns: applicationPageValidator,
  args: { eventId: v.id('events'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>
    model.history(
      ctx,
      args.eventId,
      (await requireAuth(ctx)).person._id,
      args.paginationOpts
    ),
});
export const list = query({
  returns: applicationReviewPageValidator,
  args: { eventId: v.id('events'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>
    model.list(
      ctx,
      args.eventId,
      (await requireAuth(ctx)).person._id,
      args.paginationOpts
    ),
});

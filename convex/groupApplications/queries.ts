import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth, getCurrentPerson } from '../auth';
import * as c from './contracts';
import * as model from './model';
export const getGroupApplicationForm = query({
  args: { groupId: v.id('groups') },
  returns: c.form,
  handler: async (ctx, args) =>
    model.getForm(
      ctx,
      args.groupId,
      (await getCurrentPerson(ctx))?._id ?? null
    ),
});
export const getGroupApplication = query({
  args: { applicationId: v.id('groupApplications') },
  returns: c.application,
  handler: async (ctx, args) =>
    model.read(ctx, (await requireAuth(ctx)).person._id, args.applicationId),
});
export const listMyGroupApplications = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: c.page,
  handler: async (ctx, args) =>
    model.history(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts
    ),
});
export const listGroupApplications = query({
  args: {
    groupId: v.id('groups'),
    paginationOpts: paginationOptsValidator,
    status: v.optional(c.applicationStatusValidator),
  },
  returns: c.reviewPage,
  handler: async (ctx, args) =>
    model.list(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.paginationOpts,
      args.status
    ),
});

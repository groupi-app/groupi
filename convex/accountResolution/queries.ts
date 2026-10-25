import { query } from '../_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import * as contracts from './contracts';
import * as model from './model';
export const listOwned = query({
  args: { kind: contracts.kind, paginationOpts: paginationOptsValidator },
  returns: contracts.page,
  handler: async (ctx, args) =>
    model.listForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.kind,
      args.paginationOpts
    ),
});
export const readiness = query({
  args: {},
  returns: contracts.readiness,
  handler: async ctx =>
    model.readinessForPerson(ctx, (await requireAuth(ctx)).person._id),
});

import { v } from 'convex/values';
export const recipients = query({
  args: {
    kind: contracts.kind,
    id: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.recipients,
  handler: async (ctx, args) =>
    model.recipientsForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.kind,
      args.id,
      args.paginationOpts
    ),
});

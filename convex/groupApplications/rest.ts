import {
  internalQuery,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type { TableNames } from '../_generated/dataModel';
import * as c from './contracts';
import * as model from './model';
function id<Table extends TableNames>(
  ctx: QueryCtx | MutationCtx,
  table: Table,
  value: string
) {
  const result = ctx.db.normalizeId(table, value);
  if (!result)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid resource ID.',
    });
  return result;
}
const actor = { actorId: v.id('persons'), groupId: v.string() };
const application = { ...actor, applicationId: v.string() };
async function checked(
  ctx: QueryCtx | MutationCtx,
  args: { groupId: string; applicationId: string }
) {
  const applicationId = id(ctx, 'groupApplications', args.applicationId);
  const row = await ctx.db.get(applicationId);
  if (!row || row.groupId !== id(ctx, 'groups', args.groupId))
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Application not found.',
    });
  return applicationId;
}
export const form = internalQuery({
  args: actor,
  returns: c.form,
  handler: (ctx, args) =>
    model.getForm(ctx, id(ctx, 'groups', args.groupId), args.actorId),
});
export const read = internalQuery({
  args: application,
  returns: c.application,
  handler: async (ctx, args) =>
    model.read(ctx, args.actorId, await checked(ctx, args)),
});
export const history = internalQuery({
  args: { ...actor, paginationOpts: paginationOptsValidator },
  returns: c.page,
  handler: (ctx, args) =>
    model.history(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      args.paginationOpts
    ),
});
export const list = internalQuery({
  args: {
    ...actor,
    paginationOpts: paginationOptsValidator,
    status: v.optional(c.applicationStatusValidator),
  },
  returns: c.reviewPage,
  handler: (ctx, args) =>
    model.list(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      args.paginationOpts,
      args.status
    ),
});
export const configure = internalMutation({
  args: {
    ...actor,
    applicationsEnabled: v.boolean(),
    questions: v.array(c.questionValidator),
  },
  returns: v.null(),
  handler: (ctx, args) =>
    model.configure(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      args.applicationsEnabled,
      args.questions
    ),
});
export const submit = internalMutation({
  args: { ...actor, answers: c.answersValidator },
  returns: c.result,
  handler: (ctx, args) =>
    model.submit(
      ctx,
      args.actorId,
      id(ctx, 'groups', args.groupId),
      args.answers
    ),
});
export const edit = internalMutation({
  args: { ...application, answers: c.answersValidator },
  returns: c.result,
  handler: async (ctx, args) =>
    model.edit(ctx, args.actorId, await checked(ctx, args), args.answers),
});
export const withdraw = internalMutation({
  args: application,
  returns: c.result,
  handler: async (ctx, args) =>
    model.withdraw(ctx, args.actorId, await checked(ctx, args)),
});
export const review = internalMutation({
  args: {
    ...application,
    decision: v.union(v.literal('APPROVED'), v.literal('DECLINED')),
  },
  returns: c.result,
  handler: async (ctx, args) =>
    model.review(ctx, args.actorId, await checked(ctx, args), args.decision),
});

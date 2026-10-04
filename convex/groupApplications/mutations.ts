import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import * as c from './contracts';
import * as model from './model';
export const configureGroupApplications = mutation({
  args: {
    groupId: v.id('groups'),
    applicationsEnabled: v.boolean(),
    questions: v.array(c.questionValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.configure(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.applicationsEnabled,
      args.questions
    ),
});
export const submitGroupApplication = mutation({
  args: { groupId: v.id('groups'), answers: c.answersValidator },
  returns: c.result,
  handler: async (ctx, args) =>
    model.submit(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.groupId,
      args.answers
    ),
});
export const editGroupApplication = mutation({
  args: {
    applicationId: v.id('groupApplications'),
    answers: c.answersValidator,
  },
  returns: c.result,
  handler: async (ctx, args) =>
    model.edit(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.applicationId,
      args.answers
    ),
});
export const withdrawGroupApplication = mutation({
  args: { applicationId: v.id('groupApplications') },
  returns: c.result,
  handler: async (ctx, args) =>
    model.withdraw(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.applicationId
    ),
});
export const reviewGroupApplication = mutation({
  args: {
    applicationId: v.id('groupApplications'),
    decision: v.union(v.literal('APPROVED'), v.literal('DECLINED')),
  },
  returns: c.result,
  handler: async (ctx, args) =>
    model.review(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.applicationId,
      args.decision
    ),
});

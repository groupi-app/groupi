import {
  applicationSettingsValidator,
  applicationResultValidator,
} from './contracts';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import {
  questionValidator,
  reviewerPolicyValidator,
  answersValidator,
} from './contracts';
import * as model from './model';
export const configure = mutation({
  returns: applicationSettingsValidator,
  args: {
    eventId: v.id('events'),
    questions: v.array(questionValidator),
    reviewerPolicy: reviewerPolicyValidator,
  },
  handler: async (ctx, args) =>
    model.configure(ctx, args.eventId, (await requireAuth(ctx)).person._id, {
      questions: args.questions,
      reviewerPolicy: args.reviewerPolicy,
    }),
});
/** Submit creates a request; while pending, it edits answers against the retained question snapshot. */
export const submit = mutation({
  returns: applicationResultValidator,
  args: { eventId: v.id('events'), answers: answersValidator },
  handler: async (ctx, args) =>
    model.submit(
      ctx,
      args.eventId,
      (await requireAuth(ctx)).person._id,
      args.answers
    ),
});
export const withdraw = mutation({
  returns: applicationResultValidator,
  args: { applicationId: v.id('eventApplications') },
  handler: async (ctx, args) =>
    model.withdraw(
      ctx,
      args.applicationId,
      (await requireAuth(ctx)).person._id
    ),
});
export const decide = mutation({
  returns: applicationResultValidator,
  args: {
    applicationId: v.id('eventApplications'),
    decision: v.union(v.literal('APPROVED'), v.literal('DECLINED')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    model.decide(
      ctx,
      args.applicationId,
      (await requireAuth(ctx)).person._id,
      args.decision,
      args.reason
    ),
});

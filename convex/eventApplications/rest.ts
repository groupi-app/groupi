import {
  applicationFormValidator,
  applicationPageValidator,
  applicationReviewPageValidator,
  applicationSettingsValidator,
  applicationResultValidator,
} from './contracts';
import { internalQuery, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import {
  questionValidator,
  reviewerPolicyValidator,
  answersValidator,
} from './contracts';
import * as model from './model';
const actor = { personId: v.id('persons') };
export const getForm = internalQuery({
  returns: applicationFormValidator,
  args: { ...actor, eventId: v.id('events') },
  handler: (ctx, args) => model.getForm(ctx, args.eventId, args.personId),
});
export const history = internalQuery({
  returns: applicationPageValidator,
  args: {
    ...actor,
    eventId: v.id('events'),
    paginationOpts: paginationOptsValidator,
  },
  handler: (ctx, args) =>
    model.history(ctx, args.eventId, args.personId, args.paginationOpts),
});
export const list = internalQuery({
  returns: applicationReviewPageValidator,
  args: {
    ...actor,
    eventId: v.id('events'),
    paginationOpts: paginationOptsValidator,
  },
  handler: (ctx, args) =>
    model.list(ctx, args.eventId, args.personId, args.paginationOpts),
});
export const configure = internalMutation({
  returns: applicationSettingsValidator,
  args: {
    ...actor,
    eventId: v.id('events'),
    questions: v.array(questionValidator),
    reviewerPolicy: reviewerPolicyValidator,
  },
  handler: (ctx, args) =>
    model.configure(ctx, args.eventId, args.personId, {
      questions: args.questions,
      reviewerPolicy: args.reviewerPolicy,
    }),
});
export const submit = internalMutation({
  returns: applicationResultValidator,
  args: { ...actor, eventId: v.id('events'), answers: answersValidator },
  handler: (ctx, args) =>
    model.submit(ctx, args.eventId, args.personId, args.answers),
});
export const withdraw = internalMutation({
  returns: applicationResultValidator,
  args: { ...actor, applicationId: v.id('eventApplications') },
  handler: (ctx, args) =>
    model.withdraw(ctx, args.applicationId, args.personId),
});
export const decide = internalMutation({
  returns: applicationResultValidator,
  args: {
    ...actor,
    applicationId: v.id('eventApplications'),
    decision: v.union(v.literal('APPROVED'), v.literal('DECLINED')),
    reason: v.optional(v.string()),
  },
  handler: (ctx, args) =>
    model.decide(
      ctx,
      args.applicationId,
      args.personId,
      args.decision,
      args.reason
    ),
});

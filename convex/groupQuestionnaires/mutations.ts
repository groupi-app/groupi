import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import {
  questionValidator,
  answersValidator,
} from '../eventApplications/contracts';
import * as model from './model';
import * as contracts from './contracts';
export const configureJoiningQuestionnaire = mutation({
  args: {
    groupId: v.id('groups'),
    enabled: v.boolean(),
    questions: v.array(questionValidator),
  },
  returns: contracts.form,
  handler: async (ctx, args) =>
    model.configureJoiningQuestionnaire(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id,
      args.enabled,
      args.questions
    ),
});
export const submitJoiningQuestionnaire = mutation({
  args: {
    groupId: v.id('groups'),
    version: v.number(),
    answers: answersValidator,
  },
  returns: contracts.form,
  handler: async (ctx, args) =>
    model.submitJoiningQuestionnaire(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id,
      args.version,
      args.answers
    ),
});

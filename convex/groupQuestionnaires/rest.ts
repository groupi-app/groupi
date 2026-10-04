import {
  internalQuery,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import {
  questionValidator,
  answersValidator,
} from '../eventApplications/contracts';
import * as contracts from './contracts';
import * as model from './model';
function group(ctx: QueryCtx | MutationCtx, value: string) {
  const id = ctx.db.normalizeId('groups', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Group ID.',
    });
  return id;
}
function person(ctx: QueryCtx | MutationCtx, value?: string) {
  if (value === undefined) return undefined;
  const id = ctx.db.normalizeId('persons', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid person ID.',
    });
  return id;
}
export const get = internalQuery({
  args: { groupId: v.string(), personId: v.id('persons') },
  returns: contracts.form,
  handler: (ctx, args) =>
    model.getJoiningQuestionnaire(ctx, group(ctx, args.groupId), args.personId),
});
export const configure = internalMutation({
  args: {
    groupId: v.string(),
    personId: v.id('persons'),
    enabled: v.boolean(),
    questions: v.array(questionValidator),
  },
  returns: contracts.form,
  handler: (ctx, args) =>
    model.configureJoiningQuestionnaire(
      ctx,
      group(ctx, args.groupId),
      args.personId,
      args.enabled,
      args.questions
    ),
});
export const submit = internalMutation({
  args: {
    groupId: v.string(),
    personId: v.id('persons'),
    version: v.number(),
    answers: answersValidator,
  },
  returns: contracts.form,
  handler: (ctx, args) =>
    model.submitJoiningQuestionnaire(
      ctx,
      group(ctx, args.groupId),
      args.personId,
      args.version,
      args.answers
    ),
});
export const review = internalQuery({
  args: {
    groupId: v.string(),
    personId: v.id('persons'),
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.reviewPage,
  handler: (ctx, args) =>
    model.listJoiningQuestionnaireAnswers(
      ctx,
      group(ctx, args.groupId),
      args.personId,
      args.paginationOpts
    ),
});
export const history = internalQuery({
  args: {
    groupId: v.string(),
    personId: v.id('persons'),
    authorId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.historyPage,
  handler: (ctx, args) =>
    model.listJoiningQuestionnaireHistory(
      ctx,
      group(ctx, args.groupId),
      args.personId,
      args.paginationOpts,
      person(ctx, args.authorId)
    ),
});

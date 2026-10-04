import { query } from '../_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import * as model from './model';
import * as contracts from './contracts';
export const getJoiningQuestionnaire = query({
  args: { groupId: v.id('groups') },
  returns: contracts.form,
  handler: async (ctx, args) =>
    model.getJoiningQuestionnaire(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id
    ),
});
export const listJoiningQuestionnaireAnswers = query({
  args: { groupId: v.id('groups'), paginationOpts: paginationOptsValidator },
  returns: contracts.reviewPage,
  handler: async (ctx, args) =>
    model.listJoiningQuestionnaireAnswers(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id,
      args.paginationOpts
    ),
});
export const listJoiningQuestionnaireHistory = query({
  args: {
    groupId: v.id('groups'),
    personId: v.optional(v.id('persons')),
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.historyPage,
  handler: async (ctx, args) =>
    model.listJoiningQuestionnaireHistory(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id,
      args.paginationOpts,
      args.personId
    ),
});
export const getJoiningQuestionnaireAccess = query({
  args: { groupId: v.id('groups') },
  returns: v.object({
    canRead: v.boolean(),
    hasRecord: v.boolean(),
    isMember: v.boolean(),
  }),
  handler: async (ctx, args) =>
    model.getJoiningQuestionnaireAccess(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id
    ),
});

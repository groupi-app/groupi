import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export async function removeQuestionnairesForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for (const table of [
    'groupOnboardingJobs',
    'groupQuestionnaires',
    'groupQuestionnaireIdentities',
    'groupQuestionnaireRecords',
    'groupQuestionnaireAnswers',
    'groupQuestionnaireHistory',
    'groupOnboardingDispatches',
  ] as const) {
    for await (const row of ctx.db
      .query(table)
      .withIndex('by_groupId', q => q.eq('groupId', groupId)))
      await ctx.db.delete(row._id);
  }
}
export async function removeQuestionnairesForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const notification of ctx.db
    .query('notifications')
    .withIndex('by_authorId', q => q.eq('authorId', personId))) {
    if (notification.type === 'GROUP_ONBOARDING_REQUIRED')
      await ctx.db.patch(notification._id, { authorId: undefined });
  }
  for await (const job of ctx.db
    .query('groupOnboardingJobs')
    .withIndex('by_actorId', q => q.eq('actorId', personId)))
    await ctx.db.delete(job._id);
  for (const table of [
    'groupQuestionnaireRecords',
    'groupQuestionnaireAnswers',
    'groupQuestionnaireHistory',
    'groupOnboardingDispatches',
  ] as const) {
    for await (const row of ctx.db
      .query(table)
      .withIndex('by_personId', q => q.eq('personId', personId)))
      await ctx.db.delete(row._id);
  }
}

import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export async function removeQuestionnairesForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for (const table of [
    'groupQuestionnaires',
    'groupQuestionnaireIdentities',
    'groupQuestionnaireRecords',
    'groupQuestionnaireAnswers',
    'groupQuestionnaireHistory',
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
  for (const table of [
    'groupQuestionnaireRecords',
    'groupQuestionnaireAnswers',
    'groupQuestionnaireHistory',
  ] as const) {
    for await (const row of ctx.db
      .query(table)
      .withIndex('by_personId', q => q.eq('personId', personId)))
      await ctx.db.delete(row._id);
  }
}

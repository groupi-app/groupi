import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { purgePoll } from '../groupPolls/model';
import {
  purge as purgeList,
  cleanupPerson as cleanupListPerson,
} from '../groupLists/model';
import { purgeTool } from '../groupForms/model';
export async function removeToolsForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const tool of ctx.db
    .query('groupTools')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    if (tool.kind === 'FORM') await purgeTool(ctx, tool._id);
    else if (tool.kind === 'POLL') await purgePoll(ctx, tool._id);
    else if (tool.kind === 'LIST') await purgeList(ctx, tool._id);
  for await (const policy of ctx.db
    .query('groupToolPolicies')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(policy._id);
}
export async function removeToolsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  await cleanupListPerson(ctx, personId);
  for await (const response of ctx.db
    .query('groupFormResponses')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const tool = await ctx.db.get(response.toolId);
    if (tool?.resultsVisibility === 'MEMBERS')
      await ctx.db.patch(response._id, { personId: undefined });
    else await ctx.db.delete(response._id);
  }
  for await (const vote of ctx.db
    .query('groupPollVotes')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const tool = await ctx.db.get(vote.toolId);
    if (tool?.resultsVisibility === 'MEMBERS')
      await ctx.db.patch(vote._id, { personId: undefined });
    else await ctx.db.delete(vote._id);
  }
  for await (const row of ctx.db
    .query('groupPollRevisions')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
  // Revision history is private personal recovery data, even for shared latest contributions.
  for await (const revision of ctx.db
    .query('groupFormRevisions')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await ctx.db.delete(revision._id);
  for await (const tool of ctx.db
    .query('groupTools')
    .withIndex('by_creatorId', q => q.eq('creatorId', personId)))
    await ctx.db.patch(tool._id, { creatorId: undefined });
}

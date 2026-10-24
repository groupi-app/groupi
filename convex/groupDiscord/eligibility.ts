import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { makeFunctionReference } from 'convex/server';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { oweAccessCleanup } from './memberOperations';

/** Fence provider work in the same transaction that revokes Group eligibility. */
export async function invalidateGroupDiscordEnrollment(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  removal: 'removed' | 'banned' = 'removed'
) {
  const row = await ctx.db
    .query('groupDiscordEnrollments')
    .withIndex('by_group_person', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (!row || row.handedBack) return;
  const connection = await ctx.db
    .query('groupDiscordConnections')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .unique();
  if (
    connection &&
    (connection.status !== 'active' ||
      connection.generation !== row.connectionGeneration)
  )
    return;
  if (
    row.desired === 'removed' &&
    (removal !== 'banned' ||
      row.mode !== 'membership' ||
      row.cleanupDesired === 'banned')
  )
    return;
  if (!(row.mode === 'membership' && row.externalException))
    await oweAccessCleanup(ctx, { ...row, removal });
  await ctx.db.patch(row._id, {
    desired: 'removed',
    cleanupDesired:
      removal === 'banned' ? 'banned' : (row.cleanupDesired ?? 'removed'),
    status: 'blocked',
    generation: row.generation + 1,
    error: 'Group access changed. Connect again when eligible.',
    updatedAt: Date.now(),
  });
}

const checkReference = makeFunctionReference<
  'mutation',
  {
    groupId: Id<'groups'>;
    cursor: string | null;
  },
  null
>('groupDiscord/eligibility:checkGroupEligibility');

/** Configuration mutations enqueue a bounded pass rather than fan out inline. */
export async function scheduleGroupDiscordEligibilityCheck(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  await ctx.scheduler.runAfter(0, checkReference, { groupId, cursor: null });
}

export const checkGroupEligibility = internalMutation({
  args: { groupId: v.id('groups'), cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { groupId, cursor }) => {
    const page = await ctx.db
      .query('groupDiscordEnrollments')
      .withIndex('by_group_person', q => q.eq('groupId', groupId))
      .paginate({ numItems: 20, cursor });
    for (const row of page.page) {
      if (
        row.desired === 'granted' &&
        !(await canAccessGroupMemberContent(ctx, groupId, row.personId))
      )
        await invalidateGroupDiscordEnrollment(ctx, groupId, row.personId);
    }
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, checkReference, {
        groupId,
        cursor: page.continueCursor,
      });
    return null;
  },
});

import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
/** Voluntary departure retains the explicit choice; only current members may receive mail. */
export async function preferenceFor(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  return (
    (
      await ctx.db
        .query('groupAnnouncementPreferences')
        .withIndex('by_groupId_and_personId', q =>
          q.eq('groupId', groupId).eq('personId', personId)
        )
        .unique()
    )?.subscribed ?? false
  );
}

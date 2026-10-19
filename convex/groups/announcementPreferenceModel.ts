import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
/** Only current members receive mail; fresh admission resets the prior choice. */
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

/** Fresh membership never revives consent from a prior admission. */
export async function resetPreferenceFor(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const preference = await ctx.db
    .query('groupAnnouncementPreferences')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (preference)
    await ctx.db.patch(preference._id, {
      subscribed: false,
      sourceAppId: undefined,
      sourceGrantId: undefined,
      updatedAt: Date.now(),
    });
}

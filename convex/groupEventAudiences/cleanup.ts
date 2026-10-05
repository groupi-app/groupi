import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export async function removeAudiencesForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const row of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
}
export async function removeAudiencesForEvent(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  for await (const row of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_eventId', q => q.eq('eventId', eventId)))
    await ctx.db.delete(row._id);
}
/** Grants belong to their Group/Event, not their historical sharing actor. */
export async function anonymizeAudienceActor(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_sharedById', q => q.eq('sharedById', personId)))
    await ctx.db.patch(row._id, { sharedById: undefined });
}

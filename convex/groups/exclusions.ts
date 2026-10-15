import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';
type ReadCtx = QueryCtx | MutationCtx;
export async function isGroupExcludedForPerson(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  return (
    (
      await ctx.db
        .query('communityExclusions')
        .withIndex('by_group_person', q =>
          q.eq('groupId', groupId).eq('personId', personId)
        )
        .unique()
    )?.active === true
  );
}
/** Completed history stays available; reactivation uses the independent fence below. */
export async function isEventExcludedForPerson(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  now = Date.now()
) {
  const event = await ctx.db.get(eventId);
  if (
    !event ||
    event.completedAt !== undefined ||
    (event.chosenEndDateTime !== undefined && event.chosenEndDateTime <= now)
  )
    return false;
  return matchesExclusion(ctx, eventId, personId);
}
async function matchesExclusion(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  const links = await ctx.db
    .query('groupEventAudiences')
    .withIndex('by_eventId', q => q.eq('eventId', eventId))
    .collect();
  for await (const exclusion of ctx.db
    .query('communityExclusions')
    .withIndex('by_person', q => q.eq('personId', personId))) {
    if (
      exclusion.active &&
      (exclusion.eventIds.includes(eventId) ||
        links.some(link => link.groupId === exclusion.groupId))
    )
      return true;
  }
  return false;
}
export async function requireNoEventExclusion(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  if (await isEventExcludedForPerson(ctx, eventId, personId))
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Community exclusion prevents Event access.',
    });
}
/** Capture newly linked Events before they can become active. Never restores participation. */
export async function reconcileEventExclusions(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  const links = await ctx.db
    .query('groupEventAudiences')
    .withIndex('by_eventId', q => q.eq('eventId', eventId))
    .collect();
  for (const link of links) {
    for await (const exclusion of ctx.db
      .query('communityExclusions')
      .withIndex('by_group', q => q.eq('groupId', link.groupId))) {
      if (exclusion.active && !exclusion.eventIds.includes(eventId))
        await ctx.db.patch(exclusion._id, {
          eventIds: [...exclusion.eventIds, eventId],
          cleanup: exclusion.cleanup === 'blocked' ? 'blocked' : 'pending',
          updatedAt: Date.now(),
        });
    }
  }
}

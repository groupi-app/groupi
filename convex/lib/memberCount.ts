import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';

export async function getOrComputeMemberCount(
  ctx: MutationCtx | QueryCtx,
  eventId: Id<'events'>,
  event: Doc<'events'>
): Promise<number> {
  if (event.memberCount !== undefined) {
    return event.memberCount;
  }
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();
  return memberships.length;
}

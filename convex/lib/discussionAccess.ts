import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';
export async function requireDiscussionRole(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  role: 'ATTENDEE' | 'MODERATOR' | 'ORGANIZER'
) {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  const rank = { ATTENDEE: 1, MODERATOR: 2, ORGANIZER: 3 };
  if (!membership || rank[membership.role] < rank[role])
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You do not have permission for this event content.',
    });
  return membership;
}

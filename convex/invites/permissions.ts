import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { resolveEventPermissions } from '../auth';

export function inviteError(
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'INVITE_UNAVAILABLE',
  message: string
): never {
  throw new ConvexError({ code, message });
}
export async function requireInvitePermission(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .unique();
  const event = await ctx.db.get(eventId);
  if (!event || !membership)
    inviteError('FORBIDDEN', 'Event membership required');
  const level = resolveEventPermissions(event).inviteMembers;
  const ranks = { EVERYONE: 1, ATTENDEE: 1, MODERATOR: 2, ORGANIZER: 3 };
  if (ranks[membership.role] < ranks[level])
    inviteError(
      'FORBIDDEN',
      `Permission denied: this action requires ${level === 'EVERYONE' ? 'event membership' : `${level} role`}`
    );
  return membership;
}

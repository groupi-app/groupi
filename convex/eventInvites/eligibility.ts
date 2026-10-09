import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { checkCanSendEventInvite } from '../lib/privacy';

/** Read-only ordinary recipient checks. Callers enforce current event authority. */
export async function getEventInviteEligibility(
  ctx: QueryCtx | MutationCtx,
  inviterId: Id<'persons'>,
  eventId: Id<'events'>,
  inviteeId: Id<'persons'>
) {
  if (inviterId === inviteeId)
    return {
      allowed: false as const,
      reason: 'UNAVAILABLE' as const,
      errorCode: 'INVITE_UNAVAILABLE' as const,
      message: "You can't invite yourself to an event",
    };
  const invitee = await ctx.db.get(inviteeId);
  if (!invitee)
    return {
      allowed: false as const,
      reason: 'UNAVAILABLE' as const,
      errorCode: 'NOT_FOUND' as const,
      message: 'User not found',
    };
  const privacy = await checkCanSendEventInvite(ctx, inviterId, inviteeId);
  if (!privacy.allowed)
    return {
      allowed: false as const,
      reason: 'UNAVAILABLE' as const,
      errorCode: 'FORBIDDEN' as const,
      message: privacy.reason || 'This user is not accepting event invites',
    };
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', inviteeId).eq('eventId', eventId)
    )
    .first();
  if (membership)
    return {
      allowed: false as const,
      reason: 'ALREADY_MEMBER' as const,
      errorCode: 'INVITE_UNAVAILABLE' as const,
      message: 'This user is already a member of the event',
    };
  const ban = await ctx.db
    .query('eventBans')
    .withIndex('by_person_event', q =>
      q.eq('personId', inviteeId).eq('eventId', eventId)
    )
    .first();
  if (ban)
    return {
      allowed: false as const,
      reason: 'UNAVAILABLE' as const,
      errorCode: 'FORBIDDEN' as const,
      message: 'This user is banned from the event',
    };
  const previous = await ctx.db
    .query('eventInvites')
    .withIndex('by_event_invitee', q =>
      q.eq('eventId', eventId).eq('inviteeId', inviteeId)
    )
    .collect();
  if (previous.some(invite => invite.status === 'PENDING'))
    return {
      allowed: false as const,
      reason: 'INVITATION_PENDING' as const,
      errorCode: 'INVITE_UNAVAILABLE' as const,
      message: 'An invite has already been sent to this user',
    };
  return { allowed: true as const };
}

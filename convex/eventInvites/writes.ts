import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { v, type Infer } from 'convex/values';
import { requireInvitePermission, inviteError } from '../invites/permissions';
import { createNotification } from '../lib/notifications';
import { checkIsBlocked } from '../lib/privacy';
import { getEventInviteEligibility } from './eligibility';
import { dispatchAddonLifecycle } from '../addons/lifecycle';
import { getOrComputeMemberCount } from '../lib/memberCount';

export const sendEventInviteArgs = v.object({
  eventId: v.id('events'),
  inviteePersonId: v.id('persons'),
  role: v.union(v.literal('ATTENDEE'), v.literal('MODERATOR')),
  message: v.optional(v.string()),
  _traceId: v.optional(v.string()),
});
export async function sendEventInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId, inviteePersonId, role, message }: Infer<typeof sendEventInviteArgs>
) {
  const person = { _id: personId };

  if ((message?.length ?? 0) > 480)
    inviteError('VALIDATION_ERROR', 'Message must be 480 characters or less');
  // Can't invite yourself
  if (person._id === inviteePersonId) {
    inviteError('INVITE_UNAVAILABLE', "You can't invite yourself to an event");
  }

  // Check if event exists
  const event = await ctx.db.get(eventId);
  if (!event) {
    inviteError('NOT_FOUND', 'Event not found');
  }

  // Enforce the event's configurable invite permission. The returned
  // membership is also used for the stricter moderator-invite rule below.
  const inviterMembership = await requireInvitePermission(
    ctx,
    eventId,
    personId
  );

  // Only organizers can invite as moderator
  if (role === 'MODERATOR' && inviterMembership.role !== 'ORGANIZER') {
    inviteError(
      'FORBIDDEN',
      'Only organizers can invite someone as a moderator'
    );
  }

  const eligibility = await getEventInviteEligibility(
    ctx,
    person._id,
    eventId,
    inviteePersonId
  );
  if (!eligibility.allowed)
    inviteError(eligibility.errorCode, eligibility.message);
  // Create the invite
  const inviteId = await ctx.db.insert('eventInvites', {
    eventId,
    inviterId: person._id,
    inviteeId: inviteePersonId,
    status: 'PENDING',
    role,
    message,
    createdAt: Date.now(),
  });

  // Notify the invitee
  await createNotification(ctx, {
    personId: inviteePersonId,
    type: 'EVENT_INVITE_RECEIVED',
    authorId: person._id,
    eventId,
  });

  return {
    inviteId,
    status: 'PENDING' as const,
    message: 'Invite sent successfully',
  };
}

export const acceptEventInviteArgs = v.object({
  inviteId: v.id('eventInvites'),
  _traceId: v.optional(v.string()),
});
export async function acceptEventInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { inviteId }: Infer<typeof acceptEventInviteArgs>
) {
  const person = { _id: personId };

  const invite = await ctx.db.get(inviteId);
  if (!invite) {
    inviteError('NOT_FOUND', 'Invite not found');
  }

  // Only the invitee can accept
  if (invite.inviteeId !== person._id) {
    inviteError('FORBIDDEN', "You can't accept this invite");
  }

  if (invite.status !== 'PENDING') {
    inviteError('INVITE_UNAVAILABLE', 'This invite has already been processed');
  }

  if (await checkIsBlocked(ctx, invite.inviterId, personId))
    inviteError('FORBIDDEN', 'This invitation is unavailable');
  // Check event still exists
  const event = await ctx.db.get(invite.eventId);
  if (!event) {
    inviteError('NOT_FOUND', 'Event no longer exists');
  }

  // Check if user is banned
  const isBanned = await ctx.db
    .query('eventBans')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', invite.eventId)
    )
    .first();

  if (isBanned) {
    inviteError('FORBIDDEN', 'You are banned from this event');
  }

  // Check if already a member (shouldn't happen, but be safe)
  const existingMembership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', invite.eventId)
    )
    .first();

  if (existingMembership) {
    // Already a member - just update invite status
    await ctx.db.patch(inviteId, {
      status: 'ACCEPTED',
      respondedAt: Date.now(),
    });

    return {
      success: true,
      membershipId: existingMembership._id,
      message: 'You are already a member of this event',
    };
  }

  // Update invite status
  await ctx.db.patch(inviteId, {
    status: 'ACCEPTED',
    respondedAt: Date.now(),
  });

  const countBeforeInsert = await getOrComputeMemberCount(
    ctx,
    invite.eventId,
    event
  );

  const membershipId = await ctx.db.insert('memberships', {
    personId: person._id,
    eventId: invite.eventId,
    role: invite.role,
    rsvpStatus: 'PENDING',
    updatedAt: Date.now(),
  });
  await ctx.db.patch(invite.eventId, {
    memberCount: countBeforeInsert + 1,
  });

  // Remove any other pending invites for this event
  const otherPendingInvites = await ctx.db
    .query('eventInvites')
    .withIndex('by_event_invitee', q =>
      q.eq('eventId', invite.eventId).eq('inviteeId', person._id)
    )
    .filter(q =>
      q.and(q.eq(q.field('status'), 'PENDING'), q.neq(q.field('_id'), inviteId))
    )
    .collect();

  // Delete other pending invites since user has now joined
  for (const otherInvite of otherPendingInvites) {
    await ctx.db.delete(otherInvite._id);
  }

  // Notify the inviter that their invite was accepted
  await createNotification(ctx, {
    personId: invite.inviterId,
    type: 'EVENT_INVITE_ACCEPTED',
    authorId: person._id,
    eventId: invite.eventId,
  });

  // Dispatch onMemberJoined lifecycle
  await dispatchAddonLifecycle(ctx, invite.eventId, 'onMemberJoined', {
    personId: person._id,
  });

  return {
    success: true,
    membershipId,
    message: 'Invite accepted',
  };
}

export const declineEventInviteArgs = v.object({
  inviteId: v.id('eventInvites'),
  _traceId: v.optional(v.string()),
});
export async function declineEventInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { inviteId }: Infer<typeof declineEventInviteArgs>
) {
  const person = { _id: personId };

  const invite = await ctx.db.get(inviteId);
  if (!invite) {
    inviteError('NOT_FOUND', 'Invite not found');
  }

  // Only the invitee can decline
  if (invite.inviteeId !== person._id) {
    inviteError('FORBIDDEN', "You can't decline this invite");
  }

  if (invite.status !== 'PENDING') {
    inviteError('INVITE_UNAVAILABLE', 'This invite has already been processed');
  }

  // Update to declined
  await ctx.db.patch(inviteId, {
    status: 'DECLINED',
    respondedAt: Date.now(),
  });

  return {
    success: true,
    message: 'Invite declined',
  };
}

export const cancelEventInviteArgs = v.object({
  inviteId: v.id('eventInvites'),
  _traceId: v.optional(v.string()),
});
export async function cancelEventInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { inviteId }: Infer<typeof cancelEventInviteArgs>
) {
  const person = { _id: personId };

  const invite = await ctx.db.get(inviteId);
  if (!invite) {
    inviteError('NOT_FOUND', 'Invite not found');
  }

  // Check if user is the inviter or has moderator/organizer role on the event
  const isInviter = invite.inviterId === person._id;

  if (!isInviter) {
    // Check if user is organizer/moderator
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', invite.eventId)
      )
      .first();

    if (
      !membership ||
      (membership.role !== 'ORGANIZER' && membership.role !== 'MODERATOR')
    ) {
      inviteError('FORBIDDEN', "You can't cancel this invite");
    }
  }

  if (invite.status !== 'PENDING') {
    inviteError('INVITE_UNAVAILABLE', 'This invite has already been processed');
  }

  // Delete the invite
  await ctx.db.delete(inviteId);

  return {
    success: true,
    message: 'Invite cancelled',
  };
}

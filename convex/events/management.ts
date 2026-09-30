import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';
import { requireWriteRole } from './writes';
import { notifyEventModerators, notifyPerson } from '../lib/notifications';
import { checkIfFriends, checkIsBlocked } from '../lib/privacy';
import { getOrComputeMemberCount } from '../lib/memberCount';
import { cascadeDeleteEventData } from '../lib/cascade';
import { dispatchAddonLifecycle } from '../addons/lifecycle';
export async function deleteEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');

  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Event not found' });
  }

  if (event.imageStorageId) {
    try {
      await ctx.storage.delete(event.imageStorageId);
    } catch {
      // Ignore errors - file may already be deleted
    }
  }

  await cascadeDeleteEventData(ctx, eventId);

  return { success: true };
}

export async function updateMemberRoleForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  membershipId: Id<'memberships'>,
  newRole: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'
) {
  // Get the membership to update
  const membership = await ctx.db.get(membershipId);
  if (!membership) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Membership not found',
    });
  }

  // Require organizer or moderator role in this event (single auth call)
  const currentPerson = { _id: personId };
  const currentMembership = await requireWriteRole(
    ctx,
    membership.eventId,
    personId,
    'MODERATOR'
  );

  // Moderators can manage attendee/moderator roles, but organizer authority
  // can only be granted or changed by another organizer.
  if (
    currentMembership.role !== 'ORGANIZER' &&
    (membership.role === 'ORGANIZER' || newRole === 'ORGANIZER')
  ) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only organizers can manage the organizer role',
    });
  }

  // Prevent demoting the last organizer
  if (membership.role === 'ORGANIZER' && newRole !== 'ORGANIZER') {
    const organizers = await ctx.db
      .query('memberships')
      .withIndex('by_event_role', q =>
        q.eq('eventId', membership.eventId).eq('role', 'ORGANIZER')
      )
      .collect();

    if (organizers.length <= 1) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Cannot demote the last organizer',
      });
    }
  }

  // Update the role
  await ctx.db.patch(membershipId, {
    role: newRole,
    updatedAt: Date.now(),
  });

  // Get the updated membership
  const updatedMembership = await ctx.db.get(membershipId);

  // Notify the affected user about their role change
  const notificationType =
    newRole === 'ORGANIZER' || newRole === 'MODERATOR'
      ? 'USER_PROMOTED'
      : 'USER_DEMOTED';

  await notifyPerson(ctx, {
    personId: membership.personId,
    type: notificationType,
    authorId: currentPerson._id,
    eventId: membership.eventId,
  });

  return { membership: updatedMembership };
}

export async function removeMemberForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  membershipId: Id<'memberships'>
) {
  // Get the membership to remove
  const membership = await ctx.db.get(membershipId);
  if (!membership) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Membership not found',
    });
  }

  // Require organizer or moderator role in this event (single auth call)
  const currentPerson = { _id: personId };
  const currentMembership = await requireWriteRole(
    ctx,
    membership.eventId,
    personId,
    'MODERATOR'
  );

  if (
    membership.role === 'ORGANIZER' &&
    currentMembership.role !== 'ORGANIZER'
  ) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only organizers can remove another organizer',
    });
  }

  // Prevent removing the last organizer
  if (membership.role === 'ORGANIZER') {
    const organizers = await ctx.db
      .query('memberships')
      .withIndex('by_event_role', q =>
        q.eq('eventId', membership.eventId).eq('role', 'ORGANIZER')
      )
      .collect();

    if (organizers.length <= 1) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Cannot remove the last organizer',
      });
    }
  }

  // Delete all availabilities for this membership
  const availabilities = await ctx.db
    .query('availabilities')
    .withIndex('by_membership', q => q.eq('membershipId', membershipId))
    .collect();

  for (const availability of availabilities) {
    await ctx.db.delete(availability._id);
  }

  // Notify the removed user (before deleting membership so we have eventId)
  await notifyPerson(ctx, {
    personId: membership.personId,
    type: 'USER_LEFT', // Using USER_LEFT as it indicates removal from event
    authorId: currentPerson._id,
    eventId: membership.eventId,
  });

  // Dispatch onMemberLeft lifecycle before deleting membership
  await dispatchAddonLifecycle(ctx, membership.eventId, 'onMemberLeft', {
    personId: membership.personId,
  });

  // Get count BEFORE deleting so fallback path counts correctly
  const event = await ctx.db.get(membership.eventId);
  const countBeforeDelete = event
    ? await getOrComputeMemberCount(ctx, membership.eventId, event)
    : 0;

  await ctx.db.delete(membershipId);

  if (event) {
    await ctx.db.patch(membership.eventId, {
      memberCount: Math.max(0, countBeforeDelete - 1),
    });
  }

  return { success: true };
}

export async function leaveEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  // Require authentication
  const person = { _id: personId };

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId)
    )
    .first();

  if (!membership) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this event',
    });
  }

  // Prevent the last organizer from leaving
  if (membership.role === 'ORGANIZER') {
    const organizers = await ctx.db
      .query('memberships')
      .withIndex('by_event_role', q =>
        q.eq('eventId', eventId).eq('role', 'ORGANIZER')
      )
      .collect();

    if (organizers.length <= 1) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message:
          'Cannot leave event as the last organizer. Transfer ownership first.',
      });
    }
  }

  // Delete all availabilities for this membership
  const availabilities = await ctx.db
    .query('availabilities')
    .withIndex('by_membership', q => q.eq('membershipId', membership._id))
    .collect();

  for (const availability of availabilities) {
    await ctx.db.delete(availability._id);
  }

  // Notify organizers/moderators about member leaving (before deleting)
  await notifyEventModerators(ctx, {
    eventId,
    type: 'USER_LEFT',
    authorId: person._id,
  });

  // Dispatch onMemberLeft lifecycle before deleting membership
  await dispatchAddonLifecycle(ctx, eventId, 'onMemberLeft', {
    personId: person._id,
  });

  const eventDoc = await ctx.db.get(eventId);
  const countBeforeDelete = eventDoc
    ? await getOrComputeMemberCount(ctx, eventId, eventDoc)
    : 0;

  await ctx.db.delete(membership._id);

  if (eventDoc) {
    await ctx.db.patch(eventId, {
      memberCount: Math.max(0, countBeforeDelete - 1),
    });
  }

  return { success: true };
}

export async function joinDiscoverableEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  const person = { _id: personId };

  // Verify the event exists and has FRIENDS visibility
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Event not found' });
  }

  if (event.visibility !== 'FRIENDS') {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'This event is not open for discovery',
    });
  }

  // Verify the user is friends with the event creator
  const isFriends = await checkIfFriends(ctx, person._id, event.creatorId);
  if (await checkIsBlocked(ctx, personId, event.creatorId))
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'This event is not available to join',
    });
  if (!isFriends) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message:
        'You must be friends with the event organizer to join this event',
    });
  }

  // Verify the user is not already a member
  const existingMembership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId)
    )
    .first();

  if (existingMembership) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You are already a member of this event',
    });
  }

  // Verify the user is not banned
  const ban = await ctx.db
    .query('eventBans')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId)
    )
    .first();

  if (ban) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You are banned from this event',
    });
  }

  const countBeforeInsert = await getOrComputeMemberCount(ctx, eventId, event);

  const now = Date.now();
  const membershipId = await ctx.db.insert('memberships', {
    personId: person._id,
    eventId: eventId,
    role: 'ATTENDEE',
    rsvpStatus: 'YES',
    updatedAt: now,
  });
  await ctx.db.patch(eventId, {
    memberCount: countBeforeInsert + 1,
  });

  // Notify organizers/moderators about the new member
  await notifyEventModerators(ctx, {
    eventId,
    type: 'USER_JOINED',
    authorId: person._id,
  });

  // Dispatch onMemberJoined lifecycle
  await dispatchAddonLifecycle(ctx, eventId, 'onMemberJoined', {
    personId: person._id,
  });

  return { membershipId, success: true };
}

export async function updateEventPermissionsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    createPosts,
    inviteMembers,
    viewAttendeeList,
  }: {
    eventId: Id<'events'>;
    createPosts?: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
    inviteMembers?: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
    viewAttendeeList?: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
  }
) {
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');

  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found' });
  }

  const currentPermissions = event.permissions ?? {};
  const updatedPermissions = {
    ...currentPermissions,
    ...(createPosts !== undefined && { createPosts }),
    ...(inviteMembers !== undefined && { inviteMembers }),
    ...(viewAttendeeList !== undefined && { viewAttendeeList }),
  };

  await ctx.db.patch(eventId, {
    permissions: updatedPermissions,
    updatedAt: Date.now(),
  });
}

export async function canDiscoverEventForPerson(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  event: Doc<'events'>,
  now: number
) {
  if (
    event.visibility !== 'FRIENDS' ||
    (event.chosenDateTime !== undefined && event.chosenDateTime < now)
  )
    return false;
  if (
    !(await checkIfFriends(ctx, personId, event.creatorId)) ||
    (await checkIsBlocked(ctx, personId, event.creatorId))
  )
    return false;
  const [membership, ban] = await Promise.all([
    ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', event._id)
      )
      .first(),
    ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', event._id)
      )
      .first(),
  ]);
  return membership === null && ban === null;
}

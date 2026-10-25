import type { MutationCtx } from '../_generated/server';
import { v, type Infer } from 'convex/values';
import { requireInvitePermission, inviteError } from './permissions';
import { Doc, Id } from '../_generated/dataModel';
import { notifyEventModerators } from '../lib/notifications';
import { internal } from '../_generated/api';
import { dispatchAddonLifecycle } from '../addons/lifecycle';
import { z } from '@hono/zod-openapi';
import { getOrComputeMemberCount } from '../lib/memberCount';

type InviteCreateData = {
  eventId: Id<'events'>;
  token: string;
  createdById: Id<'memberships'>;
  name?: string;
  usesTotal?: number;
  usesRemaining?: number;
  usesConsumed?: number;
  expiresAt?: number;
};

export const createInviteArgs = v.object({
  eventId: v.id('events'),
  name: v.optional(v.string()),
  usesTotal: v.optional(v.number()),
  expiresAt: v.optional(v.number()), // Unix timestamp
  _traceId: v.optional(v.string()),
});
export async function createInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId, name, usesTotal, expiresAt }: Infer<typeof createInviteArgs>
) {
  validateInviteInput({ name, usesTotal, expiresAt });
  const membership = await requireInvitePermission(ctx, eventId, personId);

  // Generate unique invite token
  const token = generateInviteToken();

  // Build the invite object with proper optional field handling
  const now = Date.now();
  const inviteData: InviteCreateData & { updatedAt: number } = {
    eventId: eventId,
    token: token,
    createdById: membership._id, // Use membership ID, not person ID
    updatedAt: now,
    usesConsumed: 0,
  };

  // Only include optional fields if they have actual values
  if (name) inviteData.name = name;
  if (usesTotal !== undefined) {
    inviteData.usesTotal = usesTotal;
    inviteData.usesRemaining = usesTotal;
  }
  if (expiresAt !== undefined) inviteData.expiresAt = expiresAt;

  // Create the invite
  const inviteId = await ctx.db.insert('invites', inviteData);

  // Get the created invite
  const invite = await ctx.db.get(inviteId);

  return {
    invite: {
      id: invite!._id,
      eventId: invite!.eventId,
      name: invite!.name,
      token: invite!.token,
      usesTotal: invite!.usesTotal,
      usesRemaining: invite!.usesRemaining,
      expiresAt: invite!.expiresAt ?? null,
      createdAt: invite!._creationTime,
      createdById: invite!.createdById,
    },
  };
}

export const updateInviteArgs = v.object({
  inviteId: v.id('invites'),
  name: v.optional(v.string()),
  usesTotal: v.optional(v.union(v.number(), v.null())),
  expiresAt: v.optional(v.union(v.number(), v.null())), // Unix timestamp
  _traceId: v.optional(v.string()),
});
export async function updateInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { inviteId, name, usesTotal, expiresAt }: Infer<typeof updateInviteArgs>
) {
  validateInviteInput({ name, usesTotal, expiresAt });
  // Get the invite
  const invite = await ctx.db.get(inviteId);
  if (!invite) {
    inviteError('NOT_FOUND', 'Invite not found');
  }

  await requireInvitePermission(ctx, invite.eventId, personId);

  const capacity = inviteCapacity(invite);
  const consumed = inviteConsumed(invite);
  const nextCapacity =
    usesTotal === undefined ? capacity : (usesTotal ?? undefined);
  const updateData: Partial<Doc<'invites'>> = {
    usesTotal: nextCapacity,
    maxUses: undefined,
    usesConsumed: consumed,
    usesRemaining:
      nextCapacity === undefined
        ? undefined
        : Math.max(0, nextCapacity - consumed),
    updatedAt: Date.now(),
    ...(name !== undefined ? { name: name || undefined } : {}),
    ...(expiresAt !== undefined ? { expiresAt: expiresAt ?? undefined } : {}),
  };

  // Update the invite
  await ctx.db.patch(inviteId, updateData);

  // Get the updated invite
  const updatedInvite = await ctx.db.get(inviteId);

  return {
    invite: {
      id: updatedInvite!._id,
      eventId: updatedInvite!.eventId,
      name: updatedInvite!.name,
      token: updatedInvite!.token,
      usesTotal: updatedInvite!.usesTotal,
      usesRemaining: updatedInvite!.usesRemaining,
      expiresAt: updatedInvite!.expiresAt ?? null,
      createdAt: updatedInvite!._creationTime,
      createdById: updatedInvite!.createdById,
    },
  };
}

export const deleteInvitesArgs = v.object({
  inviteIds: v.array(v.id('invites')),
  _traceId: v.optional(v.string()),
});
export async function deleteInvitesForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { inviteIds }: Infer<typeof deleteInvitesArgs>
) {
  // Verify all invites exist and user has permission
  const invites = await Promise.all(inviteIds.map(id => ctx.db.get(id)));

  const validInvites = invites.filter(invite => invite !== null);
  if (validInvites.length === 0) {
    inviteError('NOT_FOUND', 'No valid invites found');
  }

  // Check permissions for all events (invites might be from different events)
  const eventIds = [...new Set(validInvites.map(invite => invite!.eventId))];
  for (const eventId of eventIds) {
    await requireInvitePermission(ctx, eventId, personId);
  }

  // Delete all valid invites
  for (const invite of validInvites) {
    await ctx.db.delete(invite!._id);
  }

  return {
    deletedCount: validInvites.length,
    deletedIds: validInvites.map(invite => invite!._id),
  };
}

export const acceptInviteArgs = v.object({
  token: v.string(),
  _traceId: v.optional(v.string()),
});
export async function acceptInviteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { token }: Infer<typeof acceptInviteArgs>
) {
  // Require authentication
  const person = { _id: personId };

  // Get invite by token
  const invite = await ctx.db
    .query('invites')
    .withIndex('by_token', q => q.eq('token', token))
    .first();

  if (!invite) {
    inviteError('NOT_FOUND', 'Invite not found');
  }

  const sourceEvent = await ctx.db.get(invite.eventId);
  if (!sourceEvent) inviteError('NOT_FOUND', 'Event not found');
  // Check if invite is valid
  const now = Date.now();

  if (invite.expiresAt && invite.expiresAt <= now) {
    inviteError('INVITE_UNAVAILABLE', 'Invite has expired');
  }

  if (invite.usesRemaining !== undefined && invite.usesRemaining <= 0) {
    inviteError('INVITE_UNAVAILABLE', 'Invite has no uses remaining');
  }

  // Check if user is already a member
  const existingMembership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', invite.eventId)
    )
    .first();

  if (existingMembership) {
    const event = await ctx.db.get(invite.eventId);
    return {
      membership: {
        id: existingMembership._id,
        eventId: existingMembership.eventId,
        role: existingMembership.role,
        rsvpStatus: existingMembership.rsvpStatus,
      },
      event: {
        id: event!._id,
        title: event!.title,
        description: event!.description,
        location: event!.location,
      },
      alreadyMember: true,
    };
  }

  // Check if user is banned from this event
  const ban = await ctx.db
    .query('eventBans')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', invite.eventId)
    )
    .first();

  if (ban) {
    inviteError('FORBIDDEN', 'You have been banned from this event');
  }

  // Get count BEFORE inserting so fallback path counts correctly
  const eventDoc = await ctx.db.get(invite.eventId);
  const countBeforeInsert = eventDoc
    ? await getOrComputeMemberCount(ctx, invite.eventId, eventDoc)
    : 0;

  const membershipId = await ctx.db.insert('memberships', {
    personId: person._id,
    eventId: invite.eventId,
    role: 'ATTENDEE',
    rsvpStatus: 'PENDING',
    updatedAt: now,
  });
  if (eventDoc) {
    await ctx.db.patch(invite.eventId, {
      memberCount: countBeforeInsert + 1,
    });
  }

  // Persist usage for unlimited links too, so later capacity edits preserve joins.
  await ctx.db.patch(invite._id, {
    usesRemaining:
      invite.usesRemaining === undefined ? undefined : invite.usesRemaining - 1,
    usesTotal: inviteCapacity(invite),
    maxUses: undefined,
    usesConsumed: inviteConsumed(invite) + 1,
    updatedAt: Date.now(),
  });

  // Remove any pending internal (eventInvites) invites for this user/event
  const pendingEventInvites = await ctx.db
    .query('eventInvites')
    .withIndex('by_event_invitee', q =>
      q.eq('eventId', invite.eventId).eq('inviteeId', person._id)
    )
    .filter(q => q.eq(q.field('status'), 'PENDING'))
    .collect();

  for (const eventInvite of pendingEventInvites) {
    await ctx.db.delete(eventInvite._id);
  }

  // Notify organizers and moderators about the new member
  await notifyEventModerators(ctx, {
    eventId: invite.eventId,
    type: 'USER_JOINED',
    authorId: person._id,
  });

  // Dispatch onMemberJoined lifecycle
  await dispatchAddonLifecycle(ctx, invite.eventId, 'onMemberJoined', {
    personId: person._id,
  });

  const membership = await ctx.db.get(membershipId);

  return {
    membership: {
      id: membership!._id,
      eventId: membership!.eventId,
      role: membership!.role,
      rsvpStatus: membership!.rsvpStatus,
    },
    event: {
      id: eventDoc!._id,
      title: eventDoc!.title,
      description: eventDoc!.description,
      location: eventDoc!.location,
    },
    alreadyMember: false,
  };
}

export const createEmailInvitesArgs = v.object({
  eventId: v.id('events'),
  invites: v.array(
    v.object({
      email: v.string(),
      recipientName: v.optional(v.string()),
      plusOnes: v.optional(v.number()),
    })
  ),
  customMessage: v.optional(v.string()),
  expiresAt: v.optional(v.number()), // Unix timestamp
  _traceId: v.optional(v.string()),
});
export async function createEmailInvitesForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    invites,
    customMessage,
    expiresAt,
  }: Infer<typeof createEmailInvitesArgs>
) {
  const membership = await requireInvitePermission(ctx, eventId, personId);

  // Validate custom message length (max 480 chars)
  if (customMessage && customMessage.length > 480) {
    inviteError(
      'VALIDATION_ERROR',
      'Custom message must be 480 characters or less'
    );
  }

  validateInviteInput({ expiresAt });
  if (invites.length < 1 || invites.length > 100)
    inviteError(
      'VALIDATION_ERROR',
      'Provide between 1 and 100 email invitations'
    );
  for (const invite of invites) {
    if (
      !z.string().email().safeParse(invite.email.trim()).success ||
      (invite.recipientName?.length ?? 0) > 200 ||
      (invite.plusOnes !== undefined &&
        (!Number.isInteger(invite.plusOnes) ||
          invite.plusOnes < 0 ||
          invite.plusOnes > 99))
    )
      inviteError('VALIDATION_ERROR', 'Invalid email invitation');
  }
  const now = Date.now();
  const createdInviteIds: Id<'invites'>[] = [];

  for (const inviteData of invites) {
    // Check if an invite with this email already exists for this event
    const existingInvite = await ctx.db
      .query('invites')
      .withIndex('by_event_email', q =>
        q
          .eq('eventId', eventId)
          .eq('email', inviteData.email.trim().toLowerCase())
      )
      .first();

    if (existingInvite) {
      // Skip duplicates (don't create another invite)
      continue;
    }

    // Generate unique invite token
    const token = generateInviteToken();

    // Calculate uses (1 base + plusOnes)
    const usesTotal = 1 + (inviteData.plusOnes || 0);

    // Create the invite
    const inviteId = await ctx.db.insert('invites', {
      eventId,
      token,
      createdById: membership._id,
      name: inviteData.recipientName || inviteData.email,
      email: inviteData.email.trim().toLowerCase(),
      recipientName: inviteData.recipientName,
      customMessage,
      usesTotal,
      usesConsumed: 0,
      usesRemaining: usesTotal,
      expiresAt,
      updatedAt: now,
      // emailSentAt is intentionally undefined (pending)
    });

    createdInviteIds.push(inviteId);
  }

  return {
    createdCount: createdInviteIds.length,
    inviteIds: createdInviteIds,
  };
}

export const sendPendingEmailInvitesArgs = v.object({
  eventId: v.id('events'),
  _traceId: v.optional(v.string()),
});
export async function sendPendingEmailInvitesForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId }: Infer<typeof sendPendingEmailInvitesArgs>
) {
  // Require organizer or moderator role
  await requireInvitePermission(ctx, eventId, personId);

  // Get the event details
  const event = await ctx.db.get(eventId);
  if (!event) {
    inviteError('NOT_FOUND', 'Event not found');
  }

  // Find all pending email invites (email set, emailSentAt not set)
  const allInvites = await ctx.db
    .query('invites')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  const pendingInvites = allInvites.filter(
    invite => invite.email && invite.emailSentAt === undefined
  );

  if (pendingInvites.length === 0) {
    return { sentCount: 0 };
  }

  // Mark all pending invites as sent (optimistically)
  const now = Date.now();
  for (const invite of pendingInvites) {
    await ctx.db.patch(invite._id, {
      emailSentAt: now,
      updatedAt: now,
    });
  }

  // Prepare email data for the action
  const emailInviteData = pendingInvites.map(invite => ({
    inviteId: invite._id,
    email: invite.email!,
    recipientName: invite.recipientName,
    token: invite.token,
    customMessage: invite.customMessage,
    plusOnes: (invite.usesTotal || 1) - 1,
  }));

  // Schedule the email sending action
  const sendAction = internal.invites.actions.sendInviteEmails;
  await ctx.scheduler.runAfter(0, sendAction, {
    eventId,
    eventTitle: event.title,
    eventDescription: event.description,
    eventLocation: event.location,
    eventDateTime: event.chosenDateTime,
    eventEndDateTime: event.chosenEndDateTime,
    invites: emailInviteData,
  });

  return { sentCount: pendingInvites.length };
}

function generateInviteToken(): string {
  return crypto.randomUUID();
}
export const inviteResultValidator = v.object({
  invite: v.object({
    id: v.id('invites'),
    eventId: v.id('events'),
    name: v.optional(v.string()),
    token: v.string(),
    usesTotal: v.optional(v.number()),
    usesRemaining: v.optional(v.number()),
    expiresAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
    createdById: v.id('memberships'),
  }),
});
export const acceptResultValidator = v.object({
  membership: v.object({
    id: v.id('memberships'),
    eventId: v.id('events'),
    role: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
    rsvpStatus: v.union(
      v.literal('YES'),
      v.literal('NO'),
      v.literal('MAYBE'),
      v.literal('PENDING')
    ),
  }),
  event: v.object({
    id: v.id('events'),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  }),
  alreadyMember: v.boolean(),
});

// Legacy REST rows stored consumed uses in usesTotal and capacity in maxUses.
// App rows store capacity in usesTotal. Normalize on every write without backfill.
export function inviteCapacity(invite: Doc<'invites'>): number | undefined {
  return (
    invite.maxUses ??
    (invite.usesRemaining === undefined ? undefined : invite.usesTotal)
  );
}
function validateInviteInput(input: {
  name?: string;
  usesTotal?: number | null;
  expiresAt?: number | null;
}) {
  if ((input.name?.length ?? 0) > 200)
    inviteError(
      'VALIDATION_ERROR',
      'Invite name must be 200 characters or less'
    );
  if (
    input.usesTotal != null &&
    (!Number.isInteger(input.usesTotal) ||
      input.usesTotal < 1 ||
      input.usesTotal > 10000)
  )
    inviteError(
      'VALIDATION_ERROR',
      'Invite uses must be an integer between 1 and 10000'
    );
  if (
    input.expiresAt != null &&
    (!Number.isFinite(input.expiresAt) || input.expiresAt <= Date.now())
  )
    inviteError('VALIDATION_ERROR', 'Invite expiry must be in the future');
}

export function inviteConsumed(invite: Doc<'invites'>): number {
  if (invite.usesConsumed !== undefined) return invite.usesConsumed;
  const capacity = inviteCapacity(invite);
  return capacity === undefined
    ? (invite.usesTotal ?? 0)
    : Math.max(0, capacity - (invite.usesRemaining ?? 0));
}

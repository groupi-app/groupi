import { ConvexError, v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { authComponent } from '../auth';
import { eventViewer } from '../events/attendance';
import { checkIsBlocked } from '../lib/privacy';

export const explanation =
  'After acceptance, Friends visibility follows the new Organizer’s friends. The former Organizer becomes a Moderator. Membership and RSVP stay unchanged.';
export const result = v.object({
  eventId: v.id('events'),
  organizerId: v.id('persons'),
  createdById: v.id('persons'),
  transferId: v.union(v.id('eventTransfers'), v.null()),
  offeredById: v.union(v.id('persons'), v.null()),
  recipientId: v.union(v.id('persons'), v.null()),
  status: v.union(
    v.literal('NONE'),
    v.literal('PENDING'),
    v.literal('ACCEPTED'),
    v.literal('DECLINED'),
    v.literal('CANCELLED')
  ),
  explanation: v.string(),
});
function fail(code: 'FORBIDDEN' | 'CONFLICT', message: string): never {
  throw new ConvexError({ code, message });
}
async function currentActor(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>
) {
  const person = await ctx.db.get(personId);
  const user = person
    ? await authComponent.getAnyUserById(ctx, person.userId)
    : null;
  if (!person || !user || user.banned)
    fail('FORBIDDEN', 'Current eligible profile required');
}
export async function statusForPerson(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  await currentActor(ctx, personId);
  const { event } = await eventViewer(ctx, eventId, personId);
  const transfer = await ctx.db
    .query('eventTransfers')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .order('desc')
    .first();
  if (
    event.creatorId !== personId &&
    transfer?.recipientId !== personId &&
    transfer?.offeredById !== personId
  )
    return null;
  return {
    eventId,
    organizerId: event.creatorId,
    createdById: event.createdById ?? event.creatorId,
    transferId: transfer?._id ?? null,
    offeredById: transfer?.offeredById ?? null,
    recipientId: transfer?.recipientId ?? null,
    status: transfer?.status ?? ('NONE' as const),
    explanation,
  };
}
async function eligible(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  ownerId: Id<'persons'>,
  recipientId: Id<'persons'>
) {
  const [person, member, ban, blocked] = await Promise.all([
    ctx.db.get(recipientId),
    ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', recipientId).eq('eventId', eventId)
      )
      .first(),
    ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', recipientId).eq('eventId', eventId)
      )
      .first(),
    checkIsBlocked(ctx, ownerId, recipientId),
  ]);
  const user = person
    ? await authComponent.getAnyUserById(ctx, person.userId)
    : null;
  if (
    !user ||
    user.banned ||
    !person ||
    !member ||
    recipientId === ownerId ||
    member.role === 'ORGANIZER' ||
    ban ||
    blocked
  )
    fail('FORBIDDEN', 'Choose an eligible existing Event member');
  return member;
}
export async function offerForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  recipientId: Id<'persons'>
) {
  await currentActor(ctx, personId);
  const { event, membership } = await eventViewer(ctx, eventId, personId);
  if (event.creatorId !== personId || membership.role !== 'ORGANIZER')
    fail('FORBIDDEN', 'Only the current Organizer can offer ownership');
  await eligible(ctx, eventId, personId, recipientId);
  const pending = await ctx.db
    .query('eventTransfers')
    .withIndex('by_event_status', q =>
      q.eq('eventId', eventId).eq('status', 'PENDING')
    )
    .first();
  if (pending) fail('CONFLICT', 'An ownership offer is already pending');
  const now = Date.now();
  await ctx.db.insert('eventTransfers', {
    eventId,
    offeredById: personId,
    recipientId,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });
  return statusForPerson(ctx, personId, eventId);
}
export async function decideForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  transferId: Id<'eventTransfers'>,
  decision: 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
) {
  await currentActor(ctx, personId);
  const { event, membership } = await eventViewer(ctx, eventId, personId);
  const transfer = await ctx.db.get(transferId);
  if (
    !transfer ||
    transfer.eventId !== eventId ||
    transfer.status !== 'PENDING' ||
    transfer.offeredById !== event.creatorId
  )
    fail('CONFLICT', 'This ownership offer is no longer pending');
  if (
    decision === 'CANCELLED'
      ? personId !== transfer.offeredById || membership.role !== 'ORGANIZER'
      : personId !== transfer.recipientId
  )
    fail(
      'FORBIDDEN',
      'Only the intended transfer participant can take this action'
    );
  const now = Date.now();
  if (decision === 'ACCEPTED') {
    await currentActor(ctx, transfer.offeredById);
    const recipient = await eligible(
      ctx,
      eventId,
      transfer.offeredById,
      transfer.recipientId
    );
    const organizers = await ctx.db
      .query('memberships')
      .withIndex('by_event_role', q =>
        q.eq('eventId', eventId).eq('role', 'ORGANIZER')
      )
      .collect();
    if (!organizers.some(m => m.personId === transfer.offeredById))
      fail('CONFLICT', 'The offering Organizer no longer has authority');
    for (const organizer of organizers)
      await ctx.db.patch(organizer._id, { role: 'MODERATOR', updatedAt: now });
    await ctx.db.patch(recipient._id, { role: 'ORGANIZER', updatedAt: now });
    await ctx.db.patch(eventId, {
      creatorId: recipient.personId,
      createdById: event.createdById ?? event.creatorId,
      updatedAt: now,
    });
  }
  await ctx.db.patch(transferId, { status: decision, updatedAt: now });
  return statusForPerson(ctx, personId, eventId);
}

import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requirePerson, requireOwner } from '../groups/model';
import { membershipFor, isGroupBanned, requireManager } from '../groups/policy';
import {
  canAccessGroupMemberContent,
  requireGroupMemberContent,
} from '../groups/contentAccess';
import { requireWriteRole } from '../events/writes';
import {
  eventLogisticsForPerson,
  eventAdmissionAccess,
} from '../events/admission';
type ReadCtx = QueryCtx | MutationCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
async function eventMember(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  return ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .unique();
}
export async function canShare(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  if (!(await canAccessGroupMemberContent(ctx, groupId, personId)))
    return false;
  const group = await ctx.db.get(groupId),
    member = await membershipFor(ctx, groupId, personId);
  return Boolean(
    group &&
      member &&
      (group.eventSharingPolicy === 'MEMBERS' || member.role !== 'MEMBER')
  );
}
export async function configure(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  policy: 'MANAGERS' | 'MEMBERS'
) {
  await requireOwner(ctx, groupId, personId);
  await requireManager(ctx, groupId, personId);
  if (await isGroupBanned(ctx, groupId, personId))
    fail('FORBIDDEN', 'Group management unavailable.');
  await ctx.db.patch(groupId, {
    eventSharingPolicy: policy,
    updatedAt: Date.now(),
  });
  return null;
}
export async function share(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  groupId: Id<'groups'>
) {
  await requirePerson(ctx, personId);
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
  if (!(await canShare(ctx, groupId, personId)))
    fail('FORBIDDEN', 'Current Group sharing permission is required.');
  const existing = await ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId_and_eventId', q =>
      q.eq('groupId', groupId).eq('eventId', eventId)
    )
    .unique();
  if (
    !existing &&
    (
      await ctx.db
        .query('groupEventAudiences')
        .withIndex('by_eventId', q => q.eq('eventId', eventId))
        .take(100)
    ).length >= 100
  )
    fail(
      'VALIDATION_ERROR',
      'An Event may select at most 100 whole Groups. Withdraw a Group audience before adding another.'
    );
  if (!existing)
    await ctx.db.insert('groupEventAudiences', {
      eventId,
      groupId,
      sharedById: personId,
      createdAt: Date.now(),
    });
  return { eventId, groupId, shared: true };
}
export async function withdraw(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  groupId: Id<'groups'>
) {
  await requirePerson(ctx, personId);
  if ((await eventMember(ctx, eventId, personId))?.role !== 'ORGANIZER') {
    await requireManager(ctx, groupId, personId);
    if (await isGroupBanned(ctx, groupId, personId))
      fail('FORBIDDEN', 'Group management unavailable.');
  }
  const existing = await ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId_and_eventId', q =>
      q.eq('groupId', groupId).eq('eventId', eventId)
    )
    .unique();
  if (existing) await ctx.db.delete(existing._id);
  return { eventId, groupId, shared: false };
}
export async function friends(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  enabled: boolean
) {
  await requirePerson(ctx, personId);
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
  await ctx.db.patch(eventId, {
    friendsAudienceEnabled: enabled,
    updatedAt: Date.now(),
  });
  return { eventId, friendsShared: enabled };
}
export async function audiences(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  await requirePerson(ctx, personId);
  const event = await ctx.db.get(eventId);
  if (!event) fail('NOT_FOUND', 'Event not found.');
  const organizer =
    (await eventMember(ctx, eventId, personId))?.role === 'ORGANIZER';
  const groups = [];
  for await (const grant of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_eventId', q => q.eq('eventId', eventId))) {
    const member = await membershipFor(ctx, grant.groupId, personId),
      group = await ctx.db.get(grant.groupId);
    if (
      !group ||
      !member ||
      (await isGroupBanned(ctx, grant.groupId, personId))
    )
      continue;
    const manager = member.role !== 'MEMBER';
    if (
      !manager &&
      !(await canAccessGroupMemberContent(ctx, grant.groupId, personId))
    )
      continue;
    groups.push({
      groupId: grant.groupId,
      name: group.name,
      canWithdraw: organizer || manager,
    });
  }
  if (!organizer && !groups.length)
    fail('FORBIDDEN', 'Audience management unavailable.');
  return {
    eventId,
    friendsShared: organizer
      ? (event.friendsAudienceEnabled ?? event.visibility === 'FRIENDS')
      : null,
    canManageEvent: organizer,
    groups,
  };
}
export async function list(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requirePerson(ctx, personId);
  await requireGroupMemberContent(ctx, groupId, personId);
  if (
    !Number.isInteger(paginationOpts.numItems) ||
    paginationOpts.numItems < 1 ||
    paginationOpts.numItems > 100
  )
    fail('VALIDATION_ERROR', 'Page size must be 1–100.');
  const rows = await ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))
    .order('desc')
    .paginate(paginationOpts);
  const member = await membershipFor(ctx, groupId, personId),
    page = [];
  for (const grant of rows.page) {
    const event = await ctx.db.get(grant.eventId);
    if (
      !event ||
      (event.chosenDateTime !== undefined && event.chosenDateTime < Date.now())
    )
      continue;
    const ownMembership = await eventMember(ctx, event._id, personId);
    if (!(await eventAdmissionAccess(ctx, event, personId)).canRead) continue;
    const logistics = await eventLogisticsForPerson(ctx, event._id, personId);
    page.push({
      event: logistics.event,
      canWithdraw:
        member?.role !== 'MEMBER' || ownMembership?.role === 'ORGANIZER',
    });
  }
  return { page, isDone: rows.isDone, continueCursor: rows.continueCursor };
}

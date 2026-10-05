import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { assertNoOwnedGroups } from '../groups/model';

/** The current creator principal is responsibility; createdById is provenance. */
export async function assertNoOwnedResources(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>
) {
  await assertNoOwnedGroups(ctx, personId);
  if (
    await ctx.db
      .query('events')
      .withIndex('by_creator', q => q.eq('creatorId', personId))
      .first()
  ) {
    throw new ConvexError({
      code: 'CONFLICT',
      message:
        'Resolve owned Events before deleting this account. Transfer ownership with acceptance or explicitly delete each Event.',
    });
  }
}

import type { PaginationOptions } from 'convex/server';
import { requirePerson } from '../groups/model';
import { cascadeDeleteEventData } from '../lib/cascade';
function validatePage(paginationOpts: PaginationOptions) {
  if (
    !Number.isInteger(paginationOpts.numItems) ||
    paginationOpts.numItems < 1 ||
    paginationOpts.numItems > 100
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Page size must be an integer from 1 to 100.',
    });
}
function invalidCursor(): never {
  throw new ConvexError({
    code: 'VALIDATION_ERROR',
    message:
      'Invalid ownership cursor. Restart enumeration from the first page.',
  });
}
export async function readinessForPerson(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>
) {
  await requirePerson(ctx, personId);
  const [group, event] = await Promise.all([
    ctx.db
      .query('groups')
      .withIndex('by_ownerId', q => q.eq('ownerId', personId))
      .first(),
    ctx.db
      .query('events')
      .withIndex('by_creator', q => q.eq('creatorId', personId))
      .first(),
  ]);
  return {
    hasOwnedGroups: !!group,
    hasOwnedEvents: !!event,
    canDelete: !group && !event,
  };
}
export async function listForPerson(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  kind: 'GROUP' | 'EVENT',
  paginationOpts: PaginationOptions
) {
  await requirePerson(ctx, personId);
  validatePage(paginationOpts);
  if (kind === 'GROUP') {
    const result = await ctx.db
      .query('groups')
      .withIndex('by_ownerId', q => q.eq('ownerId', personId))
      .paginate(paginationOpts)
      .catch(invalidCursor);
    const page = await Promise.all(
      result.page.map(async group => {
        const transfer = await ctx.db
          .query('groupTransfers')
          .withIndex('by_group', q => q.eq('groupId', group._id))
          .order('desc')
          .first();
        return {
          kind,
          id: group._id,
          title: group.name,
          status: transfer?.status ?? ('NONE' as const),
          transferId: transfer?._id ?? null,
          recipientId: transfer?.recipientId ?? null,
          resolved: false as const,
        };
      })
    );
    return { ...result, page };
  }
  const result = await ctx.db
    .query('events')
    .withIndex('by_creator', q => q.eq('creatorId', personId))
    .paginate(paginationOpts)
    .catch(invalidCursor);
  const page = await Promise.all(
    result.page.map(async event => {
      const transfer = await ctx.db
        .query('eventTransfers')
        .withIndex('by_event', q => q.eq('eventId', event._id))
        .order('desc')
        .first();
      return {
        kind,
        id: event._id,
        title: event.title,
        status: transfer?.status ?? ('NONE' as const),
        transferId: transfer?._id ?? null,
        recipientId: transfer?.recipientId ?? null,
        resolved: false as const,
      };
    })
  );
  return { ...result, page };
}
/** Recovery also works for legacy Events whose creator has no membership row. */
export async function deleteOwnedEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  await requirePerson(ctx, personId);
  const event = await ctx.db.get(eventId);
  if (!event)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found.' });
  if (event.creatorId !== personId)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only the current Event owner can resolve this responsibility.',
    });
  // Match the established explicit Event deletion storage lifecycle.
  if (event.imageStorageId) {
    try {
      await ctx.storage.delete(event.imageStorageId);
    } catch {
      /* The image may already have been removed. */
    }
  }
  await cascadeDeleteEventData(ctx, eventId);
  return null;
}

import { livePerson } from '../groups/model';
import { canEnterGroup } from '../groups/policy';
import { checkIsBlocked } from '../lib/privacy';
export async function recipientsForPerson(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  kind: 'GROUP' | 'EVENT',
  value: string,
  paginationOpts: PaginationOptions
) {
  await requirePerson(ctx, personId);
  validatePage(paginationOpts);
  const groupId = kind === 'GROUP' ? ctx.db.normalizeId('groups', value) : null;
  const eventId = kind === 'EVENT' ? ctx.db.normalizeId('events', value) : null;
  const resource = groupId
    ? await ctx.db.get(groupId)
    : eventId
      ? await ctx.db.get(eventId)
      : null;
  if (
    !resource ||
    ('ownerId' in resource ? resource.ownerId : resource.creatorId) !== personId
  )
    return { page: [], isDone: true, continueCursor: '' };
  const result = groupId
    ? await ctx.db
        .query('groupMemberships')
        .withIndex('by_groupId', q => q.eq('groupId', groupId))
        .paginate(paginationOpts)
        .catch(invalidCursor)
    : await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId!))
        .paginate(paginationOpts)
        .catch(invalidCursor);
  const projected = await Promise.all(
    result.page.map(async member => {
      if (
        member.personId === personId ||
        member.role === 'OWNER' ||
        member.role === 'ORGANIZER' ||
        (await checkIsBlocked(ctx, personId, member.personId))
      )
        return null;
      const live = await livePerson(ctx, member.personId);
      if (
        !live ||
        (groupId && !(await canEnterGroup(ctx, groupId, member.personId)))
      )
        return null;
      if (
        eventId &&
        (await ctx.db
          .query('eventBans')
          .withIndex('by_person_event', q =>
            q.eq('personId', member.personId).eq('eventId', eventId)
          )
          .first())
      )
        return null;
      return {
        personId: member.personId,
        label: live.user.name || live.user.username || 'Member',
      };
    })
  );
  return {
    page: projected.filter(item => item !== null),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}

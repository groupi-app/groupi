import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
/** Narrow shared storage records back to the existing Group-only wire contract. */
export function groupDocument<
  T extends { groupId?: Id<'groups'>; eventId?: Id<'events'> },
>(value: T) {
  if (!value.groupId || value.eventId)
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Group content not found.',
    });
  return { ...value, groupId: value.groupId };
}
export function groupPage<
  P extends { page: { groupId?: Id<'groups'>; eventId?: Id<'events'> }[] },
>(value: P) {
  const { page, ...rest } = value;
  return {
    ...rest,
    page: page.map(row => groupDocument(row as P['page'][number])),
  };
}

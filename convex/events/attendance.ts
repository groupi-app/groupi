import { ConvexError } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { resolveEventPermissions } from '../auth';
export function attendanceError(
  code: 'VALIDATION_ERROR' | 'FORBIDDEN' | 'NOT_FOUND',
  message: string
): never {
  throw new ConvexError({ code, message });
}
export async function eventViewer(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  const [event, membership] = await Promise.all([
    ctx.db.get(eventId),
    ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', eventId)
      )
      .first(),
  ]);
  if (!membership)
    attendanceError('FORBIDDEN', 'You are not a member of this event');
  if (!event) attendanceError('NOT_FOUND', 'Event not found');
  return {
    event,
    membership,
    canViewAttendance: canViewAttendance(event, membership),
  };
}
export function canViewAttendance(
  event: Doc<'events'>,
  viewer: Doc<'memberships'>
) {
  const ranks = { EVERYONE: 1, ATTENDEE: 1, MODERATOR: 2, ORGANIZER: 3 };
  return (
    ranks[viewer.role] >= ranks[resolveEventPermissions(event).viewAttendeeList]
  );
}
export function requireAttendanceVisibility(viewer: {
  canViewAttendance: boolean;
}) {
  if (!viewer.canViewAttendance)
    attendanceError(
      'FORBIDDEN',
      'You do not have permission to view the attendee list'
    );
}
export function canReadResponseNote(
  viewer: Doc<'memberships'>,
  author: Doc<'memberships'>
) {
  return (
    viewer.personId === author.personId ||
    viewer.role === 'ORGANIZER' ||
    viewer.role === 'MODERATOR'
  );
}
export function privateNote(
  note: string | undefined,
  viewer: Doc<'memberships'>,
  author: Doc<'memberships'>
) {
  return canReadResponseNote(viewer, author) ? note : undefined;
}

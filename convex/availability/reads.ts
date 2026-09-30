import type { QueryCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';
import { getPersonWithUser } from '../auth';
import {
  attendanceError,
  eventViewer,
  requireAttendanceVisibility,
  privateNote,
} from '../events/attendance';
import { compareAvailabilityRecency } from './model';

export function latestResponses(rows: Doc<'availabilities'>[]) {
  const latest = new Map<Id<'memberships'>, Doc<'availabilities'>>();
  for (const row of rows) {
    const old = latest.get(row.membershipId);
    if (!old || compareAvailabilityRecency(row, old) > 0)
      latest.set(row.membershipId, row);
  }
  return [...latest.values()];
}
export async function readOwnResponse(
  ctx: QueryCtx,
  membershipId: Id<'memberships'>,
  option: Id<'potentialDateTimes'>
) {
  const rows = await ctx.db
    .query('availabilities')
    .withIndex('by_membership_date', q =>
      q.eq('membershipId', membershipId).eq('potentialDateTimeId', option)
    )
    .collect();
  return latestResponses(rows)[0] ?? null;
}
export function dateSummary(date: Doc<'potentialDateTimes'>) {
  return {
    id: date._id,
    dateTime: date.dateTime,
    endDateTime: date.endDateTime ?? null,
    note: date.note ?? null,
  };
}
export async function userSummary(ctx: QueryCtx, personId: Id<'persons'>) {
  const data = await getPersonWithUser(ctx, personId);
  return data
    ? {
        id: String(data.user._id),
        name: data.user.name ?? null,
        email: data.user.email ?? null,
        image: data.user.image ?? null,
        username: data.user.username ?? null,
      }
    : null;
}
export async function attendeeSummary(
  ctx: QueryCtx,
  member: Doc<'memberships'>,
  viewer: Doc<'memberships'>
) {
  return {
    id: member._id,
    personId: member.personId,
    role: member.role,
    rsvpStatus: member.rsvpStatus,
    rsvpNote: privateNote(member.rsvpNote, viewer, member) ?? null,
    joinedAt: member._creationTime,
    user: await userSummary(ctx, member.personId),
  };
}
export async function availabilitySummary(
  ctx: QueryCtx,
  member: Doc<'memberships'>,
  viewer: Doc<'memberships'>,
  option: Id<'potentialDateTimes'>
) {
  const response = await readOwnResponse(ctx, member._id, option);
  return {
    membershipId: member._id,
    personId: member.personId,
    user: await userSummary(ctx, member.personId),
    status: response?.status ?? ('PENDING' as const),
    note: privateNote(response?.note, viewer, member) ?? null,
  };
}
export async function readGrid(
  ctx: QueryCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  const viewer = await eventViewer(ctx, eventId, personId);
  requireAttendanceVisibility(viewer);
  const [dates, members] = await Promise.all([
    ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc')
      .collect(),
    ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
  ]);
  const memberMap = new Map(members.map(m => [m._id, m]));
  const potentialDates = await Promise.all(
    dates.map(async date => {
      const rows = latestResponses(
        await ctx.db
          .query('availabilities')
          .withIndex('by_potential_date', q =>
            q.eq('potentialDateTimeId', date._id)
          )
          .collect()
      );
      const availabilities = (
        await Promise.all(
          rows.map(async row => {
            const member = memberMap.get(row.membershipId);
            if (!member) return null;
            const user = await userSummary(ctx, member.personId);
            if (!user) return null;
            return {
              membershipId: member._id,
              user,
              status: row.status,
              note: privateNote(row.note, viewer.membership, member) ?? null,
            };
          })
        )
      ).filter((row): row is NonNullable<typeof row> => row !== null);
      const summary = {
        yes: availabilities.filter(r => r.status === 'YES').length,
        maybe: availabilities.filter(r => r.status === 'MAYBE').length,
        no: availabilities.filter(r => r.status === 'NO').length,
        pending:
          members.length -
          availabilities.filter(r => r.status !== 'PENDING').length,
      };
      return { potentialDateTime: dateSummary(date), availabilities, summary };
    })
  );
  return { eventId, potentialDates, userMembershipId: viewer.membership._id };
}
export function cursorFor(cursor: string | undefined, binding: string) {
  if (!cursor) return null;
  try {
    const value: unknown = JSON.parse(atob(cursor));
    if (
      value &&
      typeof value === 'object' &&
      'binding' in value &&
      value.binding === binding &&
      'cursor' in value &&
      typeof value.cursor === 'string'
    )
      return value.cursor;
  } catch {
    /* Invalid cursor */
  }
  attendanceError(
    'VALIDATION_ERROR',
    'Invalid attendance cursor. Start again without a cursor.'
  );
}
export function nextCursor(cursor: string, binding: string) {
  return btoa(JSON.stringify({ binding, cursor }));
}

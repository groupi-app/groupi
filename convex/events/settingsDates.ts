import { ConvexError } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireWriteRole } from './writes';
import { guardEventReactivation } from './lifecycle';
import {
  chooseEventDateForPerson,
  resetEventDateForPerson,
} from './scheduling';
import { dispatchAddonLifecycle } from '../addons/lifecycle';
import { notifyEventMembers } from '../lib/notifications';
type Option = {
  id?: Id<'potentialDateTimes'>;
  start: number;
  end?: number;
  note?: string;
};
type DatePatch = {
  mode: 'SINGLE' | 'POLL';
  start?: number;
  end?: number;
  options?: Option[];
  confirmedReset?: boolean;
};
function invalid(message: string): never {
  throw new ConvexError({ code: 'VALIDATION_ERROR', message });
}
export async function saveSettingsDates(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  change: DatePatch
) {
  const membership = await requireWriteRole(
    ctx,
    eventId,
    personId,
    'ORGANIZER'
  );
  const event = await ctx.db.get(eventId);
  if (!event) invalid('Event not found.');
  const existing = await ctx.db
    .query('potentialDateTimes')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();
  if (event.completedAt !== undefined) {
    if (!change.confirmedReset)
      invalid('Confirm rescheduling the previously completed Event.');
    await guardEventReactivation(ctx, eventId, true);
    await ctx.db.patch(eventId, { completedAt: undefined });
  }
  if (change.mode === 'SINGLE') {
    if (change.start === undefined) invalid('Choose an Event start.');
    const changed =
      event.chosenDateTime !== change.start ||
      event.chosenEndDateTime !== change.end;
    if (!changed) return;
    if (
      (event.chosenDateTime !== undefined || existing.length > 0) &&
      !change.confirmedReset
    )
      invalid('Confirm changing the Event date separately.');
    await chooseEventDateForPerson(ctx, personId, {
      eventId,
      chosenDateTime: change.start,
      chosenEndDateTime: change.end,
      selectionSource: 'MANUAL',
    });
    // Keep poll options and their votes as history; selection does not delete them.
    return;
  }
  const options = change.options ?? [];
  if (options.length > 100) invalid('Choose at most 100 date options.');
  const retained = new Set<Id<'potentialDateTimes'>>();
  const plan = options.map(option => {
    if (
      !Number.isFinite(option.start) ||
      (option.end !== undefined &&
        (!Number.isFinite(option.end) || option.end <= option.start)) ||
      (option.note !== undefined && option.note.length > 200)
    )
      invalid('Enter valid date options and notes of at most 200 characters.');
    const row = option.id
      ? existing.find(d => d._id === option.id)
      : existing.find(
          d =>
            d.dateTime === option.start &&
            d.endDateTime === option.end &&
            !retained.has(d._id)
        );
    if (option.id && !row)
      invalid('Date option does not belong to this Event.');
    if (row && retained.has(row._id)) invalid('Date options must be distinct.');
    if (row) retained.add(row._id);
    const dateChanged =
      !row || row.dateTime !== option.start || row.endDateTime !== option.end;
    if (dateChanged && option.start <= Date.now())
      invalid('New or rescheduled options must be in the future.');
    if (row && dateChanged && !change.confirmedReset)
      invalid('Confirm resetting votes for a changed date option.');
    return { option, row, dateChanged };
  });
  const removed = existing.filter(row => !retained.has(row._id));
  if (
    (removed.length > 0 || event.chosenDateTime !== undefined) &&
    !change.confirmedReset
  )
    invalid('Confirm resetting the Event date separately.');
  if (
    new Set(options.map(o => `${o.start}/${o.end ?? ''}`)).size !==
    options.length
  )
    invalid('Date options must be distinct.');
  await guardEventReactivation(ctx, eventId);
  const now = Date.now();
  // Reset only expressly replaced options. Unchanged IDs retain every old vote,
  // including passed dates when future options are added.
  for (const row of [
    ...removed,
    ...plan.filter(p => p.row && p.dateChanged).map(p => p.row!),
  ]) {
    const votes = await ctx.db
      .query('availabilities')
      .withIndex('by_potential_date', q => q.eq('potentialDateTimeId', row._id))
      .collect();
    for (const vote of votes) await ctx.db.delete(vote._id);
    if (removed.some(d => d._id === row._id)) await ctx.db.delete(row._id);
  }
  for (const { option, row, dateChanged } of plan) {
    const fields = {
      dateTime: option.start,
      endDateTime: option.end,
      note: option.note || undefined,
      updatedAt: now,
    };
    if (row) {
      if (dateChanged || row.note !== fields.note)
        await ctx.db.patch(row._id, fields);
    } else {
      const id = await ctx.db.insert('potentialDateTimes', {
        eventId,
        ...fields,
      });
      await ctx.db.insert('availabilities', {
        membershipId: membership._id,
        potentialDateTimeId: id,
        status: 'YES',
        updatedAt: now,
      });
    }
  }
  if (event.chosenDateTime !== undefined)
    await resetEventDateForPerson(ctx, personId, { eventId });
  await ctx.db.patch(eventId, {
    potentialDateTimes: options.map(o => o.start),
    updatedAt: now,
  });
  if (event.chosenDateTime === undefined)
    await dispatchAddonLifecycle(ctx, eventId, 'onDateReset');
  await notifyEventMembers(ctx, {
    eventId,
    type: 'DATE_CHANGED',
    authorId: personId,
  });
}

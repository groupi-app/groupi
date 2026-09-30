import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import {
  attendanceError,
  eventViewer,
  requireAttendanceVisibility,
} from '../events/attendance';
import {
  updateRSVPForPerson,
  chooseEventDateForPerson,
  resetEventDateForPerson,
} from '../events/scheduling';
import { parseEventDate, requireWriteRole } from '../events/writes';
import {
  eventDetailValidator,
  readEventDetail,
} from '../api/v1/internal/events';
import {
  submitAvailabilityForPerson,
  submitAvailabilityArgs,
  clearAllAvailabilityForPerson,
} from './writes';
import * as contract from './contracts';
import {
  dateSummary,
  readOwnResponse,
  attendeeSummary,
  availabilitySummary,
  cursorFor,
  nextCursor,
  readGrid,
} from './reads';
const identity = { eventId: v.id('events'), personId: v.id('persons') };
const paging = {
  limit: v.optional(v.number()),
  cursor: v.optional(v.string()),
};
export const getRsvp = internalQuery({
  args: identity,
  returns: contract.ownRsvp,
  handler: async (ctx, { eventId, personId }) => {
    const { membership } = await eventViewer(ctx, eventId, personId);
    return {
      membershipId: membership._id,
      rsvpStatus: membership.rsvpStatus,
      rsvpNote: membership.rsvpNote ?? null,
    };
  },
});
export const updateRsvp = internalMutation({
  args: {
    ...identity,
    rsvpStatus: contract.rsvpStatus,
    rsvpNote: v.optional(v.string()),
  },
  returns: contract.ownRsvp,
  handler: async (ctx, { personId, ...args }) => {
    const { membership } = await updateRSVPForPerson(ctx, personId, args);
    if (!membership) attendanceError('NOT_FOUND', 'Membership not found');
    return {
      membershipId: membership._id,
      rsvpStatus: membership.rsvpStatus,
      rsvpNote: membership.rsvpNote ?? null,
    };
  },
});
export const submit = internalMutation({
  args: { ...identity, responses: submitAvailabilityArgs.fields.responses },
  returns: v.object({ created: v.number(), updated: v.number() }),
  handler: async (ctx, { personId, ...args }) => {
    const result = await submitAvailabilityForPerson(ctx, personId, args);
    return {
      created: result.responses.filter(r => r.action === 'created').length,
      updated: result.responses.filter(r => r.action === 'updated').length,
    };
  },
});
export const clear = internalMutation({
  args: identity,
  returns: v.object({
    deletedCount: v.number(),
    membershipId: v.id('memberships'),
  }),
  handler: async (ctx, { personId, eventId }) =>
    clearAllAvailabilityForPerson(ctx, personId, { eventId }),
});
export const chooseDate = internalMutation({
  args: {
    ...identity,
    selection: v.union(
      v.object({
        selectionSource: v.literal('POLL'),
        potentialDateTimeId: v.id('potentialDateTimes'),
      }),
      v.object({
        selectionSource: v.literal('MANUAL'),
        chosenDateTime: v.string(),
        chosenEndDateTime: v.optional(v.string()),
      })
    ),
  },
  returns: eventDetailValidator,
  handler: async (ctx, { eventId, personId, selection }) => {
    await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
    if (selection.selectionSource === 'POLL') {
      const option = await ctx.db.get(selection.potentialDateTimeId);
      if (!option || option.eventId !== eventId)
        attendanceError(
          'VALIDATION_ERROR',
          'Potential date time does not belong to this event'
        );
      await chooseEventDateForPerson(ctx, personId, {
        eventId,
        ...selection,
        chosenDateTime: option.dateTime,
        chosenEndDateTime: option.endDateTime,
      });
    } else
      await chooseEventDateForPerson(ctx, personId, {
        eventId,
        selectionSource: 'MANUAL',
        chosenDateTime: parseEventDate(selection.chosenDateTime),
        chosenEndDateTime:
          selection.chosenEndDateTime === undefined
            ? undefined
            : parseEventDate(selection.chosenEndDateTime),
      });
    const result = await readEventDetail(ctx, eventId);
    if (!result) attendanceError('NOT_FOUND', 'Event not found');
    return result;
  },
});
export const resetDate = internalMutation({
  args: identity,
  returns: eventDetailValidator,
  handler: async (ctx, { eventId, personId }) => {
    await resetEventDateForPerson(ctx, personId, { eventId });
    const result = await readEventDetail(ctx, eventId);
    if (!result) attendanceError('NOT_FOUND', 'Event not found');
    return result;
  },
});
export const members = internalQuery({
  args: { ...identity, ...paging },
  returns: v.union(
    v.array(contract.attendanceMember),
    v.object({
      items: v.array(contract.attendanceMember),
      nextCursor: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, { eventId, personId, limit, cursor }) => {
    const viewer = await eventViewer(ctx, eventId, personId);
    requireAttendanceVisibility(viewer);
    const query = ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc');
    if (limit === undefined)
      return (
        await Promise.all(
          (await query.collect()).map(m =>
            attendeeSummary(ctx, m, viewer.membership)
          )
        )
      ).filter(m => m.user !== null);
    const binding = JSON.stringify(['members', personId, eventId]);
    let page;
    try {
      page = await query.paginate({
        numItems: limit,
        cursor: cursorFor(cursor, binding),
      });
    } catch {
      attendanceError(
        'VALIDATION_ERROR',
        'Invalid attendance cursor. Start again without a cursor.'
      );
    }
    return {
      items: (
        await Promise.all(
          page.page.map(m => attendeeSummary(ctx, m, viewer.membership))
        )
      ).filter(m => m.user !== null),
      nextCursor: page.isDone ? null : nextCursor(page.continueCursor, binding),
    };
  },
});
export const dates = internalQuery({
  args: { ...identity, ...paging },
  returns: v.union(
    v.array(contract.potentialDate),
    v.object({
      items: v.array(contract.potentialDate),
      nextCursor: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, { eventId, personId, limit, cursor }) => {
    await eventViewer(ctx, eventId, personId);
    const query = ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('asc');
    if (limit === undefined) return (await query.collect()).map(dateSummary);
    const binding = JSON.stringify(['dates', personId, eventId]);
    let page;
    try {
      page = await query.paginate({
        numItems: limit,
        cursor: cursorFor(cursor, binding),
      });
    } catch {
      attendanceError(
        'VALIDATION_ERROR',
        'Invalid attendance cursor. Start again without a cursor.'
      );
    }
    return {
      items: page.page.map(dateSummary),
      nextCursor: page.isDone ? null : nextCursor(page.continueCursor, binding),
    };
  },
});
export const mine = internalQuery({
  args: { ...identity, limit: v.number(), cursor: v.optional(v.string()) },
  returns: v.object({
    items: v.array(contract.ownResponse),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { eventId, personId, limit, cursor }) => {
    const viewer = await eventViewer(ctx, eventId, personId);
    const binding = JSON.stringify(['own', personId, eventId]);
    let page;
    try {
      page = await ctx.db
        .query('potentialDateTimes')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .order('asc')
        .paginate({ numItems: limit, cursor: cursorFor(cursor, binding) });
    } catch {
      attendanceError(
        'VALIDATION_ERROR',
        'Invalid attendance cursor. Start again without a cursor.'
      );
    }
    const items = await Promise.all(
      page.page.map(async option => {
        const response = await readOwnResponse(
          ctx,
          viewer.membership._id,
          option._id
        );
        return {
          potentialDateTime: dateSummary(option),
          availabilityId: response?._id ?? null,
          status: response?.status ?? ('PENDING' as const),
          note: response?.note ?? null,
        };
      })
    );
    return {
      items,
      nextCursor: page.isDone ? null : nextCursor(page.continueCursor, binding),
    };
  },
});
export const responses = internalQuery({
  args: {
    ...identity,
    potentialDateTimeId: v.id('potentialDateTimes'),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(contract.memberResponse),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (
    ctx,
    { eventId, personId, potentialDateTimeId, limit, cursor }
  ) => {
    const viewer = await eventViewer(ctx, eventId, personId);
    requireAttendanceVisibility(viewer);
    const option = await ctx.db.get(potentialDateTimeId);
    if (!option || option.eventId !== eventId)
      attendanceError(
        'VALIDATION_ERROR',
        'Potential date time does not belong to this event'
      );
    const binding = JSON.stringify([
      'responses',
      personId,
      eventId,
      potentialDateTimeId,
    ]);
    let page;
    try {
      page = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .order('asc')
        .paginate({ numItems: limit, cursor: cursorFor(cursor, binding) });
    } catch {
      attendanceError(
        'VALIDATION_ERROR',
        'Invalid attendance cursor. Start again without a cursor.'
      );
    }
    return {
      items: (
        await Promise.all(
          page.page.map(member =>
            availabilitySummary(
              ctx,
              member,
              viewer.membership,
              potentialDateTimeId
            )
          )
        )
      ).filter(m => m.user !== null),
      nextCursor: page.isDone ? null : nextCursor(page.continueCursor, binding),
    };
  },
});
export const grid = internalQuery({
  args: identity,
  returns: v.object({
    eventId: v.id('events'),
    potentialDates: v.array(contract.gridEntry),
    userMembershipId: v.id('memberships'),
  }),
  handler: async (ctx, { eventId, personId }) =>
    readGrid(ctx, eventId, personId),
});

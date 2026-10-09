import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';
import { readGrid, dateSummary } from '../../../availability/reads';
import { eventViewer, attendanceError } from '../../../events/attendance';
import { submitAvailabilityForPerson } from '../../../availability/writes';
import { gridEntry, potentialDate } from '../../../availability/contracts';
export const getAvailabilityGrid = internalQuery({
  args: { eventId: v.string(), personId: v.id('persons') },
  returns: v.object({
    eventId: v.id('events'),
    userMembershipId: v.id('memberships'),
    potentialDates: v.array(gridEntry),
  }),
  handler: async (ctx, { eventId, personId }) =>
    readGrid(ctx, eventId as Id<'events'>, personId),
});
export const submitAvailability = internalMutation({
  args: {
    membershipId: v.string(),
    responses: v.array(
      v.object({
        potentialDateTimeId: v.string(),
        status: v.union(v.literal('YES'), v.literal('MAYBE'), v.literal('NO')),
        note: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({ created: v.number(), updated: v.number() }),
  handler: async (ctx, { membershipId, responses }) => {
    const membership = await ctx.db.get(membershipId as Id<'memberships'>);
    if (!membership) attendanceError('NOT_FOUND', 'Membership not found');
    const result = await submitAvailabilityForPerson(ctx, membership.personId, {
      eventId: membership.eventId,
      responses: responses.map(response => ({
        ...response,
        potentialDateTimeId:
          response.potentialDateTimeId as Id<'potentialDateTimes'>,
      })),
    });
    return {
      created: result.responses.filter(r => r.action === 'created').length,
      updated: result.responses.filter(r => r.action === 'updated').length,
    };
  },
});
export const getPotentialDates = internalQuery({
  args: { eventId: v.string(), personId: v.id('persons') },
  returns: v.object({ potentialDates: v.array(potentialDate) }),
  handler: async (ctx, { eventId, personId }) => {
    const id = eventId as Id<'events'>;
    await eventViewer(ctx, id, personId);
    return {
      potentialDates: (
        await ctx.db
          .query('potentialDateTimes')
          .withIndex('by_event', q => q.eq('eventId', id))
          .order('asc')
          .collect()
      ).map(dateSummary),
    };
  },
});

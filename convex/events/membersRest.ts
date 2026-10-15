import { eventViewer, requireAttendanceVisibility } from './attendance';
import { attendeeSummary } from '../availability/reads';
import { attendanceMember, ownRsvp } from '../availability/contracts';
import { updateRSVPForPerson } from './scheduling';
import { internalQuery, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

/**
 * Internal queries and mutations for member routes
 */

export const listEventMembers = internalQuery({
  args: { eventId: v.string(), personId: v.id('persons') },
  returns: v.object({ members: v.array(attendanceMember) }),
  handler: async (ctx, { eventId, personId }) => {
    const id = eventId as Id<'events'>;
    const viewer = await eventViewer(ctx, id, personId);
    requireAttendanceVisibility(viewer);
    const members = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', id))
      .collect();
    return {
      members: (
        await Promise.all(
          members.map(member => attendeeSummary(ctx, member, viewer.membership))
        )
      ).filter(member => member.user !== null),
    };
  },
});

export const updateRsvp = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    rsvpStatus: v.union(
      v.literal('YES'),
      v.literal('NO'),
      v.literal('MAYBE'),
      v.literal('PENDING')
    ),
    rsvpNote: v.optional(v.string()),
  },
  returns: ownRsvp,
  handler: async (ctx, { personId, eventId, rsvpStatus, rsvpNote }) => {
    const result = await updateRSVPForPerson(ctx, personId as Id<'persons'>, {
      eventId: eventId as Id<'events'>,
      rsvpStatus,
      rsvpNote,
    });
    return {
      membershipId: result.membership!._id,
      rsvpStatus: result.membership!.rsvpStatus,
      rsvpNote: result.membership!.rsvpNote ?? null,
    };
  },
});

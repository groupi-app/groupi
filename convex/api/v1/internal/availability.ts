import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { getPersonWithUser } from '../../../auth';
import type { Doc } from '../../../_generated/dataModel';

/**
 * Internal queries and mutations for availability routes
 */

function compareAvailabilityRecency(
  left: Doc<'availabilities'>,
  right: Doc<'availabilities'>
): number {
  const timestampDifference =
    (left.updatedAt ?? left._creationTime) -
    (right.updatedAt ?? right._creationTime);

  if (timestampDifference !== 0) return timestampDifference;

  const creationTimeDifference = left._creationTime - right._creationTime;
  if (creationTimeDifference !== 0) return creationTimeDifference;

  return String(left._id).localeCompare(String(right._id));
}

export const getAvailabilityGrid = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    // Get all potential date times
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .order('asc')
      .collect();

    // Get all memberships
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();

    // Get all availabilities for these memberships
    const allAvailabilities = await ctx.db.query('availabilities').collect();
    const membershipIds = new Set(memberships.map(m => m._id));
    const eventAvailabilities = allAvailabilities.filter(a =>
      membershipIds.has(a.membershipId)
    );

    // Build grid
    const grid = await Promise.all(
      potentialDates.map(async pdt => {
        const dateAvailabilities = eventAvailabilities.filter(
          a => a.potentialDateTimeId === pdt._id
        );

        const availabilitiesWithUsers = await Promise.all(
          dateAvailabilities.map(async avail => {
            const membership = memberships.find(
              m => m._id === avail.membershipId
            );
            if (!membership) return null;

            const memberData = await getPersonWithUser(
              ctx,
              membership.personId
            );
            if (!memberData) return null;

            return {
              membershipId: membership._id,
              user: {
                id: memberData.user._id,
                name: memberData.user.name ?? null,
                email: memberData.user.email ?? null,
                image: memberData.user.image ?? null,
                username: memberData.user.username ?? null,
              },
              status: avail.status,
            };
          })
        );

        const validAvailabilities = availabilitiesWithUsers.filter(
          a => a !== null
        );

        // Calculate summary
        const summary = {
          yes: validAvailabilities.filter(a => a!.status === 'YES').length,
          maybe: validAvailabilities.filter(a => a!.status === 'MAYBE').length,
          no: validAvailabilities.filter(a => a!.status === 'NO').length,
          pending: memberships.length - validAvailabilities.length,
        };

        return {
          potentialDateTime: {
            id: pdt._id,
            dateTime: pdt.dateTime,
            endDateTime: pdt.endDateTime ?? null,
          },
          availabilities: validAvailabilities,
          summary,
        };
      })
    );

    return {
      potentialDates: grid,
    };
  },
});

export const submitAvailability = internalMutation({
  args: {
    membershipId: v.string(),
    responses: v.array(
      v.object({
        potentialDateTimeId: v.string(),
        status: v.union(v.literal('YES'), v.literal('MAYBE'), v.literal('NO')),
      })
    ),
  },
  returns: v.object({ created: v.number(), updated: v.number() }),
  handler: async (ctx, { membershipId, responses }) => {
    const uniquePotentialDateTimeIds = new Set(
      responses.map(response => response.potentialDateTimeId)
    );
    if (uniquePotentialDateTimeIds.size !== responses.length) {
      throw new Error(
        'Each potential date time can only appear once per availability submission'
      );
    }

    const membership = await ctx.db.get(membershipId as Id<'memberships'>);
    if (!membership) {
      throw new Error('Membership not found');
    }

    let created = 0;
    let updated = 0;
    const now = Date.now();

    for (const response of responses) {
      const potentialDateTime = await ctx.db.get(
        response.potentialDateTimeId as Id<'potentialDateTimes'>
      );
      if (
        !potentialDateTime ||
        potentialDateTime.eventId !== membership.eventId
      ) {
        throw new Error('Potential date time does not belong to this event');
      }

      const existingAvailabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership_date', q =>
          q
            .eq('membershipId', membershipId as Id<'memberships'>)
            .eq(
              'potentialDateTimeId',
              response.potentialDateTimeId as Id<'potentialDateTimes'>
            )
        )
        .collect();

      const existing =
        existingAvailabilities.reduce<Doc<'availabilities'> | null>(
          (mostRecent, availability) =>
            !mostRecent ||
            compareAvailabilityRecency(availability, mostRecent) > 0
              ? availability
              : mostRecent,
          null
        );

      if (existing) {
        await Promise.all(
          existingAvailabilities
            .filter(availability => availability._id !== existing._id)
            .map(availability => ctx.db.delete(availability._id))
        );
      }

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: response.status,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert('availabilities', {
          membershipId: membershipId as Id<'memberships'>,
          potentialDateTimeId:
            response.potentialDateTimeId as Id<'potentialDateTimes'>,
          status: response.status,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created, updated };
  },
});

export const getPotentialDates = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .order('asc')
      .collect();

    return {
      potentialDates: potentialDates.map(pdt => ({
        id: pdt._id,
        dateTime: pdt.dateTime,
        endDateTime: pdt.endDateTime ?? null,
      })),
    };
  },
});

import { v, type Infer } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { compareAvailabilityRecency } from './model';
import { attendanceError } from '../events/attendance';
async function consolidateAvailabilityResponses(
  ctx: MutationCtx,
  membershipId: Id<'memberships'>,
  potentialDateTimeId: Id<'potentialDateTimes'>
): Promise<Doc<'availabilities'> | null> {
  const existingAvailabilities = await ctx.db
    .query('availabilities')
    .withIndex('by_membership_date', q =>
      q
        .eq('membershipId', membershipId)
        .eq('potentialDateTimeId', potentialDateTimeId)
    )
    .collect();

  if (existingAvailabilities.length === 0) return null;

  const mostRecentAvailability = existingAvailabilities.reduce(
    (mostRecent, availability) =>
      compareAvailabilityRecency(availability, mostRecent) > 0
        ? availability
        : mostRecent
  );

  await Promise.all(
    existingAvailabilities
      .filter(availability => availability._id !== mostRecentAvailability._id)
      .map(availability => ctx.db.delete(availability._id))
  );

  return mostRecentAvailability;
}

function assertUniquePotentialDateTimeIds(
  responses: Array<{ potentialDateTimeId: Id<'potentialDateTimes'> }>
) {
  const uniqueIds = new Set(
    responses.map(response => response.potentialDateTimeId)
  );
  if (uniqueIds.size !== responses.length) {
    attendanceError(
      'VALIDATION_ERROR',
      'Each potential date time can only appear once per availability submission'
    );
  }
}

export const submitAvailabilityArgs = v.object({
  eventId: v.id('events'),
  responses: v.array(
    v.object({
      potentialDateTimeId: v.id('potentialDateTimes'),
      status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
      note: v.optional(v.string()),
    })
  ),
  _traceId: v.optional(v.string()),
});
export async function submitAvailabilityForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId, responses }: Infer<typeof submitAvailabilityArgs>
) {
  // Require authentication and membership
  const person = { _id: personId };

  assertUniquePotentialDateTimeIds(responses);

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId)
    )
    .first();

  if (!membership) {
    attendanceError('FORBIDDEN', 'You are not a member of this event');
  }

  const now = Date.now();
  const results: Array<{
    potentialDateTimeId: Id<'potentialDateTimes'>;
    status: 'YES' | 'NO' | 'MAYBE';
    action: 'created' | 'updated';
  }> = [];

  // Process sequentially so each response observes earlier writes in this
  // transaction and a membership/date pair can never be inserted twice.
  for (const { potentialDateTimeId, status, note } of responses) {
    if (note && note.length > 200) {
      attendanceError(
        'VALIDATION_ERROR',
        'Note must be 200 characters or less'
      );
    }

    const potentialDateTime = await ctx.db.get(potentialDateTimeId);
    if (!potentialDateTime || potentialDateTime.eventId !== eventId) {
      attendanceError(
        'VALIDATION_ERROR',
        'Potential date time does not belong to this event'
      );
    }

    const existingAvailability = await consolidateAvailabilityResponses(
      ctx,
      membership._id,
      potentialDateTimeId
    );

    if (existingAvailability) {
      await ctx.db.patch(existingAvailability._id, {
        status,
        note: note || undefined,
        updatedAt: now,
      });
      results.push({
        potentialDateTimeId,
        status,
        action: 'updated',
      });
    } else {
      await ctx.db.insert('availabilities', {
        membershipId: membership._id,
        potentialDateTimeId,
        status,
        note: note || undefined,
        updatedAt: now,
      });
      results.push({
        potentialDateTimeId,
        status,
        action: 'created',
      });
    }
  }

  return {
    responses: results,
    membershipId: membership._id,
  };
}
export const updateSingleAvailabilityArgs = v.object({
  potentialDateTimeId: v.id('potentialDateTimes'),
  status: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
  note: v.optional(v.string()),
  _traceId: v.optional(v.string()),
});
export async function updateSingleAvailabilityForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    potentialDateTimeId,
    status,
    note,
  }: Infer<typeof updateSingleAvailabilityArgs>
) {
  // Require authentication
  const person = { _id: personId };

  // Get the potential date time to find the event
  const potentialDateTime = await ctx.db.get(potentialDateTimeId);
  if (!potentialDateTime) {
    attendanceError('VALIDATION_ERROR', 'Potential date time not found');
  }

  // Get user's membership for this event
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', potentialDateTime.eventId)
    )
    .first();

  if (!membership) {
    attendanceError('FORBIDDEN', 'You are not a member of this event');
  }

  // Validate note length
  if (note && note.length > 200) {
    attendanceError('VALIDATION_ERROR', 'Note must be 200 characters or less');
  }

  // Collapse any historical duplicates before applying the update.
  const existingAvailability = await consolidateAvailabilityResponses(
    ctx,
    membership._id,
    potentialDateTimeId
  );

  if (existingAvailability) {
    // Update existing availability
    await ctx.db.patch(existingAvailability._id, {
      status: status,
      note: note || undefined,
      updatedAt: Date.now(),
    });
    return {
      availabilityId: existingAvailability._id,
      status,
      action: 'updated' as const,
    };
  } else {
    // Create new availability
    const availabilityId = await ctx.db.insert('availabilities', {
      membershipId: membership._id,
      potentialDateTimeId: potentialDateTimeId,
      status: status,
      note: note || undefined,
      updatedAt: Date.now(),
    });
    return {
      availabilityId,
      status,
      action: 'created' as const,
    };
  }
}
export const clearAllAvailabilityArgs = v.object({
  eventId: v.id('events'),
  _traceId: v.optional(v.string()),
});
export async function clearAllAvailabilityForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId }: Infer<typeof clearAllAvailabilityArgs>
) {
  // Require authentication and membership
  const person = { _id: personId };

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId)
    )
    .first();

  if (!membership) {
    attendanceError('FORBIDDEN', 'You are not a member of this event');
  }

  // Get all availabilities for this member
  const availabilities = await ctx.db
    .query('availabilities')
    .withIndex('by_membership', q => q.eq('membershipId', membership._id))
    .collect();

  // Delete all availabilities
  await Promise.all(
    availabilities.map(availability => ctx.db.delete(availability._id))
  );

  return {
    deletedCount: availabilities.length,
    membershipId: membership._id,
  };
}

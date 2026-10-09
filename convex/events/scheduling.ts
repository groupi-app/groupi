import { v, type Infer } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import {
  notifyEventMembers,
  notifyEventModerators,
} from '../lib/notifications';
import { REMINDER_OFFSETS, type ReminderOffset } from '../types';
import { dispatchAddonLifecycle } from '../addons/lifecycle';
import { requireWriteRole, reminderOffsetValidator } from './writes';
import { dateSelectionSourceValidator } from './validators';
import { compareAvailabilityRecency } from '../availability/model';
import { attendanceError } from './attendance';
export const updateRSVPArgs = v.object({
  eventId: v.id('events'),
  rsvpStatus: v.union(
    v.literal('YES'),
    v.literal('MAYBE'),
    v.literal('NO'),
    v.literal('PENDING')
  ),
  rsvpNote: v.optional(v.string()),
  _traceId: v.optional(v.string()),
});
export async function updateRSVPForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId, rsvpStatus, rsvpNote }: Infer<typeof updateRSVPArgs>
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

  // Validate note length
  if (rsvpNote && rsvpNote.length > 200) {
    attendanceError(
      'VALIDATION_ERROR',
      'RSVP note must be 200 characters or less'
    );
  }

  // Update the RSVP status and note
  await ctx.db.patch(membership._id, {
    rsvpStatus: rsvpStatus,
    rsvpNote: rsvpNote || undefined,
    updatedAt: Date.now(),
  });

  // Get the updated membership
  const updatedMembership = await ctx.db.get(membership._id);

  // Notify organizers/moderators about RSVP change
  await notifyEventModerators(ctx, {
    eventId,
    type: 'USER_RSVP',
    authorId: person._id,
    rsvp: rsvpStatus,
  });

  return { membership: updatedMembership };
}
export const chooseEventDateArgs = v.object({
  eventId: v.id('events'),
  chosenDateTime: v.number(), // Unix timestamp
  chosenEndDateTime: v.optional(v.number()), // Unix timestamp for end time
  potentialDateTimeId: v.optional(v.id('potentialDateTimes')),
  selectionSource: v.optional(dateSelectionSourceValidator),
  reminderOffset: v.optional(reminderOffsetValidator),
  _traceId: v.optional(v.string()),
});
export async function chooseEventDateForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    chosenDateTime,
    chosenEndDateTime,
    potentialDateTimeId,
    selectionSource,
    reminderOffset,
  }: Infer<typeof chooseEventDateArgs>
) {
  // Require organizer role (single auth call)
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
  const person = { _id: personId };

  // Validate end time is after start time if provided
  if (
    chosenEndDateTime !== undefined &&
    (!Number.isFinite(chosenEndDateTime) || chosenEndDateTime <= chosenDateTime)
  ) {
    attendanceError('VALIDATION_ERROR', 'End time must be after start time');
  }

  // Validate chosen date is in the future
  if (!Number.isFinite(chosenDateTime) || chosenDateTime <= Date.now()) {
    attendanceError('VALIDATION_ERROR', 'Event date must be in the future');
  }

  if (selectionSource === 'POLL' && !potentialDateTimeId) {
    attendanceError(
      'VALIDATION_ERROR',
      'A potential date time is required for poll selections'
    );
  }

  if (selectionSource === 'MANUAL' && potentialDateTimeId) {
    attendanceError(
      'VALIDATION_ERROR',
      'Manual date selections cannot include a poll option'
    );
  }

  // Current clients explicitly identify poll/manual selections. Legacy
  // clients omit the source and potential date ID, so infer a poll selection
  // only when its exact start/end pair identifies one unique event option.
  let selectedPotentialDateTimeId = potentialDateTimeId;
  if (!selectedPotentialDateTimeId && selectionSource !== 'MANUAL') {
    const matchingPotentialDateTimes = (
      await ctx.db
        .query('potentialDateTimes')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect()
    ).filter(
      potentialDateTime =>
        potentialDateTime.dateTime === chosenDateTime &&
        potentialDateTime.endDateTime === chosenEndDateTime
    );

    if (matchingPotentialDateTimes.length > 1) {
      attendanceError(
        'VALIDATION_ERROR',
        'This date option is ambiguous. Refresh the event and select it again.'
      );
    }

    selectedPotentialDateTimeId = matchingPotentialDateTimes[0]?._id;
  }

  if (selectedPotentialDateTimeId) {
    const potentialDateTime = await ctx.db.get(selectedPotentialDateTimeId);
    if (!potentialDateTime || potentialDateTime.eventId !== eventId) {
      attendanceError(
        'VALIDATION_ERROR',
        'Potential date time does not belong to this event'
      );
    }

    if (
      potentialDateTime.dateTime !== chosenDateTime ||
      potentialDateTime.endDateTime !== chosenEndDateTime
    ) {
      attendanceError(
        'VALIDATION_ERROR',
        'Chosen date time does not match the selected option'
      );
    }
  }

  // Validate reminder offset won't result in a past reminder time
  if (reminderOffset) {
    const offsetMs = REMINDER_OFFSETS[reminderOffset as ReminderOffset];
    if (offsetMs && chosenDateTime - offsetMs <= Date.now()) {
      attendanceError(
        'VALIDATION_ERROR',
        'Reminder time would be in the past. Choose a shorter reminder offset.'
      );
    }
  }

  // Update the event with chosen date
  // Always set both fields together to prevent sync issues
  // If endDateTime not provided, explicitly clear it
  const now = Date.now();
  await ctx.db.patch(eventId, {
    chosenDateTime: chosenDateTime,
    chosenEndDateTime: chosenEndDateTime ?? undefined,
    updatedAt: now,
  });

  if (selectedPotentialDateTimeId) {
    const [memberships, availabilities] = await Promise.all([
      ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
      ctx.db
        .query('availabilities')
        .withIndex('by_potential_date', q =>
          q.eq('potentialDateTimeId', selectedPotentialDateTimeId)
        )
        .collect(),
    ]);

    const latestAvailabilityByMembership = new Map<
      Doc<'availabilities'>['membershipId'],
      Doc<'availabilities'>
    >();
    for (const availability of availabilities) {
      const existing = latestAvailabilityByMembership.get(
        availability.membershipId
      );
      if (!existing || compareAvailabilityRecency(availability, existing) > 0) {
        latestAvailabilityByMembership.set(
          availability.membershipId,
          availability
        );
      }
    }

    const duplicateAvailabilities = availabilities.filter(
      availability =>
        latestAvailabilityByMembership.get(availability.membershipId)?._id !==
        availability._id
    );

    await Promise.all([
      ...memberships.map(membership =>
        ctx.db.patch(membership._id, {
          rsvpStatus:
            latestAvailabilityByMembership.get(membership._id)?.status ??
            'PENDING',
          updatedAt: now,
        })
      ),
      ...duplicateAvailabilities.map(availability =>
        ctx.db.delete(availability._id)
      ),
    ]);
  }

  // Get the updated event
  const updatedEvent = await ctx.db.get(eventId);

  // Notify all members about date being chosen
  await notifyEventMembers(ctx, {
    eventId,
    type: 'DATE_CHOSEN',
    authorId: person._id,
    datetime: chosenDateTime,
    rsvpFromMembership: selectedPotentialDateTimeId !== undefined,
  });

  // Dispatch onDateChosen to all enabled add-ons
  await dispatchAddonLifecycle(ctx, eventId, 'onDateChosen', {
    chosenDateTime,
  });

  return { event: updatedEvent };
}
export const resetEventDateArgs = v.object({
  eventId: v.id('events'),
  _traceId: v.optional(v.string()),
});
export async function resetEventDateForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  { eventId }: Infer<typeof resetEventDateArgs>
) {
  // Require organizer role (single auth call)
  await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
  const person = { _id: personId };

  // Dispatch onDateReset to all enabled add-ons (e.g. cancel reminders)
  await dispatchAddonLifecycle(ctx, eventId, 'onDateReset');

  // Update the event to remove chosen date and end date
  await ctx.db.patch(eventId, {
    chosenDateTime: undefined,
    chosenEndDateTime: undefined,
    updatedAt: Date.now(),
  });

  // Get the updated event
  const updatedEvent = await ctx.db.get(eventId);

  // Notify all members about date being reset
  await notifyEventMembers(ctx, {
    eventId,
    type: 'DATE_RESET',
    authorId: person._id,
  });

  return { event: updatedEvent };
}

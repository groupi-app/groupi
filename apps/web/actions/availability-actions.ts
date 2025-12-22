'use server';

import { updateTag } from 'next/cache';
import { updateMemberAvailabilities, chooseDateTime, resetChosenDate, updatePotentialDateTimes } from '@groupi/services';
import { db } from '@groupi/services/server';
import { pusherServer } from '@/lib/pusher-server';
import { pusherLogger } from '@/lib/logger';
import type { ResultTuple } from '@groupi/schema';
import type {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  ConnectionError,
  ConstraintError,
  OperationError,
} from '@groupi/schema';

// ============================================================================
// AVAILABILITY ACTIONS
// ============================================================================

export type AvailabilityMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

interface UpdateAvailabilitiesInput {
  eventId: string;
  availabilityUpdates: Array<{
    potentialDateTimeId: string;
    status: 'YES' | 'NO' | 'MAYBE';
  }>;
}

interface ChooseDateTimeInput {
  eventId: string;
  pdtId: string;
}

/**
 * Update user's availability for potential date times
 * Returns: [error, { message }] tuple
 */
export async function updateAvailabilitiesAction(
  input: UpdateAvailabilitiesInput
): Promise<ResultTuple<AvailabilityMutationError, { message: string }>> {
  const result = await updateMemberAvailabilities({
    eventId: input.eventId,
    availabilities: input.availabilityUpdates.map(update => ({
      potentialDateTimeId: update.potentialDateTimeId,
      status: update.status,
    })),
  });

  // Invalidate availability cache on successful update
  if (!result[0]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-availability`);

    // Trigger Pusher event for event availability
    const availabilityChannel = `event-${input.eventId}-availability`;
    const availabilityEventData = {
      type: 'UPDATE' as const,
      new: { eventId: input.eventId },
    };
    
    pusherLogger.debug(
      { eventId: input.eventId, channel: availabilityChannel, data: availabilityEventData },
      'Triggering Pusher availability-changed event for availability update'
    );
    
    await pusherServer
      .trigger(availabilityChannel, 'availability-changed', availabilityEventData)
      .then(() => {
        pusherLogger.info(
          { eventId: input.eventId, channel: availabilityChannel },
          'Successfully triggered Pusher availability-changed event'
        );
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          { eventId: input.eventId, channel: availabilityChannel, error: err },
          'Failed to trigger Pusher availability-changed event'
        );
      });
  }

  return result;
}

/**
 * Choose the final date/time for an event (organizer only)
 * Returns: [error, { message }] tuple
 */
export async function chooseDateTimeAction(
  input: ChooseDateTimeInput
): Promise<ResultTuple<AvailabilityMutationError, { message: string }>> {
  const result = await chooseDateTime({
    eventId: input.eventId,
    potentialDateTimeId: input.pdtId,
  });

  // Invalidate event cache on successful date selection
  if (!result[0]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-header`);
    updateTag(`event-${input.eventId}-availability`);

    // Fetch the actual chosenDateTime to include in Pusher event
    const potentialDateTime = await db.potentialDateTime.findUnique({
      where: { id: input.pdtId },
      select: { dateTime: true },
    });

    const chosenDateTime = potentialDateTime?.dateTime || null;

    // Trigger Pusher event for event header (chosen date affects header)
    const headerChannel = `event-${input.eventId}-header`;
    const headerEventData = {
      type: 'UPDATE' as const,
      new: {
        id: input.eventId,
        chosenDateTime: chosenDateTime,
      },
    };
    
    pusherLogger.debug(
      { eventId: input.eventId, channel: headerChannel, data: headerEventData },
      'Triggering Pusher event-changed event for date selection'
    );
    
    await pusherServer
      .trigger(headerChannel, 'event-changed', headerEventData)
      .then(() => {
        pusherLogger.info(
          { eventId: input.eventId, channel: headerChannel },
          'Successfully triggered Pusher event-changed event'
        );
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          { eventId: input.eventId, channel: headerChannel, error: err },
          'Failed to trigger Pusher event-changed event'
        );
      });

    // Trigger Pusher event for event availability
    const availabilityChannel = `event-${input.eventId}-availability`;
    const availabilityEventData = {
      type: 'UPDATE' as const,
      new: { eventId: input.eventId },
    };
    
    pusherLogger.debug(
      { eventId: input.eventId, channel: availabilityChannel, data: availabilityEventData },
      'Triggering Pusher availability-changed event for date selection'
    );
    
    await pusherServer
      .trigger(availabilityChannel, 'availability-changed', availabilityEventData)
      .then(() => {
        pusherLogger.info(
          { eventId: input.eventId, channel: availabilityChannel },
          'Successfully triggered Pusher availability-changed event'
        );
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          { eventId: input.eventId, channel: availabilityChannel, error: err },
          'Failed to trigger Pusher availability-changed event'
        );
      });
  }

  return result;
}

interface ResetChosenDateInput {
  eventId: string;
}

/**
 * Reset the chosen date/time for an event (organizer only)
 * Sets chosenDateTime to null to start a new poll
 * Returns: [error, { message }] tuple
 */
export async function resetChosenDateAction(
  input: ResetChosenDateInput
): Promise<ResultTuple<AvailabilityMutationError, { message: string }>> {
  pusherLogger.debug(
    { eventId: input.eventId },
    'resetChosenDateAction called'
  );
  
  const result = await resetChosenDate({
    eventId: input.eventId,
  });

  pusherLogger.debug(
    { eventId: input.eventId, hasError: !!result[0], hasData: !!result[1] },
    'resetChosenDate result'
  );

  // Invalidate event cache on successful date reset
  if (!result[0]) {
    pusherLogger.debug(
      { eventId: input.eventId },
      'Date reset successful, preparing to trigger Pusher events'
    );
    
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-header`);
    updateTag(`event-${input.eventId}-availability`);

    // Trigger Pusher event for event header (chosen date reset affects header)
    const headerChannel = `event-${input.eventId}-header`;
    const headerEventData = {
      type: 'UPDATE' as const,
      new: {
        id: input.eventId,
        chosenDateTime: null,
      },
    };
    
    pusherLogger.debug(
      { eventId: input.eventId, channel: headerChannel, data: headerEventData },
      'Triggering Pusher event-changed event for date reset'
    );
    
    await pusherServer
      .trigger(headerChannel, 'event-changed', headerEventData)
      .then(() => {
        pusherLogger.info(
          { eventId: input.eventId, channel: headerChannel },
          'Successfully triggered Pusher event-changed event for date reset'
        );
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          { eventId: input.eventId, channel: headerChannel, error: err },
          'Failed to trigger Pusher event-changed event for date reset'
        );
      });

    // Trigger Pusher event for event availability
    const availabilityChannel = `event-${input.eventId}-availability`;
    const availabilityEventData = {
      type: 'UPDATE' as const,
      new: { eventId: input.eventId },
    };
    
    pusherLogger.debug(
      { eventId: input.eventId, channel: availabilityChannel, data: availabilityEventData },
      'Triggering Pusher availability-changed event for date reset'
    );
    
    await pusherServer
      .trigger(availabilityChannel, 'availability-changed', availabilityEventData)
      .then(() => {
        pusherLogger.info(
          { eventId: input.eventId, channel: availabilityChannel },
          'Successfully triggered Pusher availability-changed event for date reset'
        );
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          { eventId: input.eventId, channel: availabilityChannel, error: err },
          'Failed to trigger Pusher availability-changed event for date reset'
        );
      });
  }

  return result;
}

interface UpdatePotentialDateTimesInput {
  eventId: string;
  potentialDateTimes: string[];
}

/**
 * Update potential date times for an event (organizer only)
 * Replaces all existing potential date times with new ones
 * Returns: [error, { message }] tuple
 */
export async function updatePotentialDateTimesAction(
  input: UpdatePotentialDateTimesInput
): Promise<ResultTuple<AvailabilityMutationError, { message: string }>> {
  pusherLogger.debug(
    { eventId: input.eventId, potentialDateTimesCount: input.potentialDateTimes.length },
    'updatePotentialDateTimesAction called'
  );
  
  const result = await updatePotentialDateTimes({
    eventId: input.eventId,
    potentialDateTimes: input.potentialDateTimes,
  });

  pusherLogger.debug(
    { eventId: input.eventId, hasError: !!result[0], hasData: !!result[1] },
    'updatePotentialDateTimes result'
  );

  // Invalidate event cache on successful update
  if (!result[0]) {
    pusherLogger.debug(
      { eventId: input.eventId },
      'Potential date times updated successfully, preparing to trigger Pusher events'
    );
    
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-header`);
    updateTag(`event-${input.eventId}-availability`);

    // Trigger Pusher event for event availability (potential date times affect availability page)
    const availabilityChannel = `event-${input.eventId}-availability`;
    const availabilityEventData = {
      type: 'UPDATE' as const,
      new: { eventId: input.eventId },
    };
    
    pusherLogger.debug(
      { eventId: input.eventId, channel: availabilityChannel, data: availabilityEventData },
      'Triggering Pusher availability-changed event for potential date times update'
    );
    
    await pusherServer
      .trigger(availabilityChannel, 'availability-changed', availabilityEventData)
      .then(() => {
        pusherLogger.info(
          { eventId: input.eventId, channel: availabilityChannel },
          'Successfully triggered Pusher availability-changed event for potential date times update'
        );
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          { eventId: input.eventId, channel: availabilityChannel, error: err },
          'Failed to trigger Pusher availability-changed event for potential date times update'
        );
      });
  }

  return result;
}

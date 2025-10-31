'use server';

import { updateTag } from 'next/cache';
import { updateMemberAvailabilities, chooseDateTime } from '@groupi/services';
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

type AvailabilityMutationError =
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
  }

  return result;
}

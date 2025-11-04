'use server';

import { updateTag } from 'next/cache';
import {
  createEvent,
  updateEventDetails,
  deleteEvent,
  leaveEvent,
  getUserId,
} from '@groupi/services';
import type { ResultTuple } from '@groupi/schema';
import type {
  CreateEventParams,
  UpdateEventDetailsParams,
  DeleteEventParams,
  LeaveEventParams,
} from '@groupi/schema/params';
import type {
  EventHeaderData,
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
// EVENT ACTIONS
// ============================================================================

type EventMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

/**
 * Create a new event
 * Returns: [error, EventHeaderData] tuple
 */
export async function createEventAction(
  input: CreateEventParams
): Promise<ResultTuple<EventMutationError, EventHeaderData>> {
  const result = await createEvent({
    title: input.title,
    description: input.description || '',
    location: input.location || '',
    potentialDateTimes: input.potentialDateTimes,
  });

  // Invalidate user events cache on successful creation
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-events`);
    }
  }

  return result;
}

/**
 * Update event details
 * Returns: [error, EventHeaderData] tuple
 */
export async function updateEventDetailsAction(
  input: UpdateEventDetailsParams
): Promise<ResultTuple<EventMutationError, EventHeaderData>> {
  const result = await updateEventDetails({
    eventId: input.eventId,
    title: input.title,
    description: input.description,
    location: input.location,
  });

  // Invalidate event cache on successful update
  if (!result[0]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-header`);
    updateTag(`event-${input.eventId}-details`);
  }

  return result;
}

/**
 * Delete an event
 * Returns: [error, { message }] tuple
 */
export async function deleteEventAction(
  input: DeleteEventParams
): Promise<ResultTuple<EventMutationError, { message: string }>> {
  const result = await deleteEvent({
    eventId: input.eventId,
  });

  // Invalidate all event-related caches on successful deletion
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-events`);
    }
    updateTag(`event-${input.eventId}`);
  }

  return result;
}

/**
 * Leave an event
 * Returns: [error, { message }] tuple
 */
export async function leaveEventAction(
  input: LeaveEventParams
): Promise<ResultTuple<EventMutationError, { message: string }>> {
  const result = await leaveEvent({
    eventId: input.eventId,
  });

  // Invalidate event members cache and user events cache on successful leave
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-events`);
    }
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-members`);
  }

  return result;
}

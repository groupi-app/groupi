'use server';

import { updateTag } from 'next/cache';
import {
  createEvent,
  updateEventDetails,
  deleteEvent,
  leaveEvent,
} from '@groupi/services';
import { getUserId } from '@groupi/services/server';
import { pusherServer } from '@/lib/pusher-server';
import { pusherLogger } from '@/lib/logger';
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

export type EventMutationError =
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
  if (!result[0] && result[1]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-events`);

      // Trigger Pusher event for user's event list
      await pusherServer
        .trigger(`user-${userId}-events`, 'event-changed', {
          type: 'INSERT',
          new: result[1],
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err,
              userId,
              operation: 'event-changed',
              type: 'INSERT',
            },
            'Failed to trigger event-changed event'
          );
        });
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
  if (!result[0] && result[1]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-header`);
    updateTag(`event-${input.eventId}-details`);

    // Trigger Pusher event for event header
    await pusherServer
      .trigger(`event-${input.eventId}-header`, 'event-changed', {
        type: 'UPDATE',
        new: result[1],
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          {
            error: err,
            eventId: input.eventId,
            operation: 'event-changed',
            type: 'UPDATE',
          },
          'Failed to trigger event-changed event'
        );
      });
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

      // Trigger Pusher event for user's event list
      await pusherServer
        .trigger(`user-${userId}-events`, 'event-changed', {
          type: 'DELETE',
          old: { id: input.eventId },
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err,
              userId,
              operation: 'event-changed',
              type: 'DELETE',
            },
            'Failed to trigger event-changed event'
          );
        });
    }
    updateTag(`event-${input.eventId}`);

    // Trigger Pusher event for event header
    await pusherServer
      .trigger(`event-${input.eventId}-header`, 'event-changed', {
        type: 'DELETE',
        old: { id: input.eventId },
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          {
            error: err,
            eventId: input.eventId,
            operation: 'event-changed',
            type: 'DELETE',
          },
          'Failed to trigger event-changed event'
        );
      });
  }

  return result;
}

/**
 * Leave an event
 * Returns: [error, { message }] tuple
 */
export async function leaveEventAction(
  input: LeaveEventParams
): Promise<
  ResultTuple<EventMutationError, { message: string; membershipId: string }>
> {
  const result = await leaveEvent({
    eventId: input.eventId,
  });

  // Invalidate event members cache and user events cache on successful leave
  if (!result[0] && result[1]) {
    const membershipId = result[1].membershipId;
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-events`);

      // Trigger Pusher event for user's event list
      await pusherServer
        .trigger(`user-${userId}-events`, 'event-changed', {
          type: 'DELETE',
          old: { id: input.eventId },
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err,
              userId,
              operation: 'event-changed',
              type: 'DELETE',
            },
            'Failed to trigger event-changed event'
          );
        });
    }
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-members`);

    // Trigger Pusher event for event members with membership ID
    await pusherServer
      .trigger(`event-${input.eventId}-members`, 'member-changed', {
        type: 'DELETE',
        old: { id: membershipId },
      })
      .catch((err: unknown) => {
        pusherLogger.error(
          {
            error: err,
            eventId: input.eventId,
            membershipId,
            operation: 'member-changed',
            type: 'DELETE',
          },
          'Failed to trigger member-changed event'
        );
      });
  }

  return result;
}

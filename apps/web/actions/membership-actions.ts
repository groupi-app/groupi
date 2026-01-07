'use server';

import { updateTag } from 'next/cache';
import {
  updateMemberRole,
  removeMemberFromEvent,
  updateMemberRSVP,
} from '@groupi/services';
import { pusherServer } from '@/lib/pusher-server';
import { pusherLogger } from '@/lib/logger';
import { withActionTrace } from '@/lib/action-trace';
import type { ResultTuple, MembershipData } from '@groupi/schema';
import type { UpdateMemberRoleParams } from '@groupi/schema/params';
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
// MEMBERSHIP ACTIONS
// ============================================================================

export type MembershipMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

interface RemoveMemberInput {
  memberId: string;
}

interface UpdateRSVPInput {
  eventId: string;
  status: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
}

/**
 * Update a member's role in an event
 * Returns: [error, MembershipData] tuple
 */
export async function updateMemberRoleAction(
  input: UpdateMemberRoleParams
): Promise<ResultTuple<MembershipMutationError, MembershipData>> {
  return withActionTrace('updateMemberRole', async () => {
    const result = await updateMemberRole({
      membershipId: input.membershipId,
      role: input.role,
    });

    // Invalidate member list cache on successful role update
    if (!result[0] && result[1]) {
      const eventId = result[1].eventId;
      updateTag(`event-${eventId}`);
      updateTag(`event-${eventId}-members`);

      // Trigger Pusher event for event members
      await pusherServer
        .trigger(`event-${eventId}-members`, 'member-changed', {
          type: 'UPDATE',
          new: result[1],
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            { error: err },
            '[Pusher] Failed to trigger member-changed'
          );
        });
    }

    return result;
  });
}

/**
 * Remove a member from an event
 * Returns: [error, { message, eventId }] tuple
 */
export async function removeMemberAction(
  input: RemoveMemberInput
): Promise<
  ResultTuple<MembershipMutationError, { message: string; eventId?: string }>
> {
  return withActionTrace('removeMember', async () => {
    const result = await removeMemberFromEvent({
      membershipId: input.memberId,
    });

    // Invalidate member list cache on successful removal
    if (
      !result[0] &&
      result[1] &&
      'eventId' in result[1] &&
      result[1].eventId
    ) {
      const eventId = result[1].eventId;
      updateTag(`event-${eventId}`);
      updateTag(`event-${eventId}-members`);

      // Trigger Pusher event for event members
      await pusherServer
        .trigger(`event-${eventId}-members`, 'member-changed', {
          type: 'DELETE',
          old: { id: input.memberId },
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            { error: err },
            '[Pusher] Failed to trigger member-changed'
          );
        });
    }

    return result;
  });
}

/**
 * Update current user's RSVP status for an event
 * Returns: [error, MembershipData] tuple
 */
export async function updateRSVPAction(
  input: UpdateRSVPInput
): Promise<ResultTuple<MembershipMutationError, MembershipData>> {
  return withActionTrace('updateRSVP', async () => {
    pusherLogger.debug(
      { eventId: input.eventId, rsvpStatus: input.status },
      'updateRSVPAction called'
    );

    const result = await updateMemberRSVP({
      eventId: input.eventId,
      rsvpStatus: input.status,
    });

    pusherLogger.debug(
      { eventId: input.eventId, hasError: !!result[0], hasData: !!result[1] },
      'updateMemberRSVP result'
    );

    // Invalidate member list and header cache on successful RSVP update
    if (!result[0] && result[1]) {
      pusherLogger.debug(
        { eventId: input.eventId, membershipData: result[1] },
        'RSVP update successful, preparing to trigger Pusher events'
      );
      updateTag(`event-${input.eventId}`);
      updateTag(`event-${input.eventId}-members`);
      updateTag(`event-${input.eventId}-header`);

      // Trigger Pusher event for event members
      const memberChannel = `event-${input.eventId}-members`;
      const memberEventData = {
        type: 'UPDATE' as const,
        new: result[1],
      };

      pusherLogger.debug(
        {
          eventId: input.eventId,
          channel: memberChannel,
          data: memberEventData,
        },
        'Triggering Pusher member-changed event for RSVP update'
      );

      await pusherServer
        .trigger(memberChannel, 'member-changed', memberEventData)
        .then(() => {
          pusherLogger.info(
            { eventId: input.eventId, channel: memberChannel },
            'Successfully triggered Pusher member-changed event'
          );
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            { eventId: input.eventId, channel: memberChannel, error: err },
            'Failed to trigger Pusher member-changed event'
          );
        });

      // Trigger Pusher event for event header (RSVP affects header display)
      const headerChannel = `event-${input.eventId}-header`;
      const headerEventData = {
        type: 'UPDATE' as const,
        new: result[1],
      };

      pusherLogger.debug(
        {
          eventId: input.eventId,
          channel: headerChannel,
          data: headerEventData,
        },
        'Triggering Pusher event-changed event for RSVP update'
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
    }

    return result;
  });
}

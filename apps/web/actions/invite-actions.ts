'use server';

import { updateTag } from 'next/cache';
import { createInvite, deleteInvite, acceptInvite } from '@groupi/services';
import { getUserId } from '@groupi/services/server';
import { pusherServer } from '@/lib/pusher-server';
import { pusherLogger } from '@/lib/logger';
import type { ResultTuple, EventInviteData } from '@groupi/schema';
import type { CreateInviteParams } from '@groupi/schema/params';
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
import { withActionTrace } from '@/lib/action-trace';

// ============================================================================
// INVITE ACTIONS
// ============================================================================

export type InviteMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

interface DeleteInviteInput {
  inviteId: string;
}

interface AcceptInviteInput {
  inviteId: string;
}

/**
 * Create a new invite for an event
 * Returns: [error, EventInviteData] tuple
 */
export async function createInviteAction(
  input: CreateInviteParams
): Promise<ResultTuple<InviteMutationError, EventInviteData>> {
  return withActionTrace('createInvite', async () => {
    const result = await createInvite({
      eventId: input.eventId,
      name: input.name,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt,
    });

    // Invalidate event invites cache on successful creation
    if (!result[0] && result[1]) {
      updateTag(`event-${input.eventId}`);
      updateTag(`event-${input.eventId}-invites`);

      // Trigger Pusher event for event invites
      await pusherServer
        .trigger(`event-${input.eventId}-invites`, 'invite-changed', {
          type: 'INSERT',
          new: result[1],
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err instanceof Error ? err.message : String(err),
              eventId: input.eventId,
              operation: 'invite-changed',
              type: 'INSERT',
            },
            'Failed to trigger invite-changed event'
          );
        });
    }

    return result;
  });
}

/**
 * Delete a single invite
 * Returns: [error, { message }] tuple
 */
export async function deleteInviteAction(
  input: DeleteInviteInput
): Promise<
  ResultTuple<InviteMutationError, { message: string; eventId: string }>
> {
  return withActionTrace('deleteInvite', async () => {
    const result = await deleteInvite({
      inviteId: input.inviteId,
    });

    // Invalidate invites cache on successful deletion
    if (!result[0] && result[1] && result[1].eventId) {
      const eventId = result[1].eventId;
      updateTag(`event-${eventId}`);
      updateTag(`event-${eventId}-invites`);

      // Trigger Pusher event for event invites
      await pusherServer
        .trigger(`event-${eventId}-invites`, 'invite-changed', {
          type: 'DELETE',
          old: { id: input.inviteId },
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err instanceof Error ? err.message : String(err),
              eventId,
              inviteId: input.inviteId,
              operation: 'invite-changed',
              type: 'DELETE',
            },
            'Failed to trigger invite-changed event'
          );
        });
    }

    return result;
  });
}

/**
 * Accept an invite (join event)
 * Returns: [error, { message, membershipId }] tuple
 */
export async function acceptInviteAction(
  input: AcceptInviteInput
): Promise<
  ResultTuple<
    InviteMutationError,
    { message: string; membershipId: string; eventId: string }
  >
> {
  return withActionTrace('acceptInvite', async () => {
    const result = await acceptInvite({
      inviteId: input.inviteId,
    });

    // Invalidate event members cache on successful acceptance
    if (!result[0] && result[1]) {
      const eventId = result[1].eventId;
      const membershipId = result[1].membershipId;
      updateTag(`event-${eventId}`);
      updateTag(`event-${eventId}-members`);

      // Trigger Pusher event for event members with membership ID
      await pusherServer
        .trigger(`event-${eventId}-members`, 'member-changed', {
          type: 'INSERT',
          new: { id: membershipId },
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err instanceof Error ? err.message : String(err),
              eventId,
              membershipId,
              operation: 'member-changed',
              type: 'INSERT',
            },
            'Failed to trigger member-changed event'
          );
        });

      // Also trigger for user's event list if we can get userId
      const [, userId] = await getUserId();
      if (userId) {
        await pusherServer
          .trigger(`user-${userId}-events`, 'event-changed', {
            type: 'INSERT',
            new: { id: eventId },
          })
          .catch((err: unknown) => {
            pusherLogger.error(
              {
                error: err instanceof Error ? err.message : String(err),
                userId,
                eventId,
                operation: 'event-changed',
                type: 'INSERT',
              },
              'Failed to trigger event-changed event'
            );
          });
      }
    }

    return result;
  });
}

'use server';

import { updateTag } from 'next/cache';
import { createInvite, deleteInvite, acceptInvite } from '@groupi/services';
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

// ============================================================================
// INVITE ACTIONS
// ============================================================================

type InviteMutationError =
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
  const result = await createInvite({
    eventId: input.eventId,
    name: input.name,
    maxUses: input.maxUses,
    expiresAt: input.expiresAt,
  });

  // Invalidate event invites cache on successful creation
  if (!result[0]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-invites`);
  }

  return result;
}

/**
 * Delete a single invite
 * Returns: [error, { message }] tuple
 */
export async function deleteInviteAction(
  input: DeleteInviteInput
): Promise<
  ResultTuple<InviteMutationError, { message: string; eventId?: string }>
> {
  const result = await deleteInvite({
    inviteId: input.inviteId,
  });

  // Invalidate invites cache on successful deletion
  if (!result[0] && result[1] && 'eventId' in result[1] && result[1].eventId) {
    updateTag(`event-${result[1].eventId}`);
    updateTag(`event-${result[1].eventId}-invites`);
  }

  return result;
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
    { message: string; membershipId: string; eventId?: string }
  >
> {
  const result = await acceptInvite({
    inviteId: input.inviteId,
  });

  // Invalidate event members cache on successful acceptance
  if (!result[0] && result[1] && 'eventId' in result[1] && result[1].eventId) {
    updateTag(`event-${result[1].eventId}`);
    updateTag(`event-${result[1].eventId}-members`);
  }

  return result;
}

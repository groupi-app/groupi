'use server';

import { updateTag } from 'next/cache';
import {
  updateMemberRole,
  removeMemberFromEvent,
  updateMemberRSVP,
} from '@groupi/services';
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

type MembershipMutationError =
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
  const result = await updateMemberRole({
    membershipId: input.membershipId,
    role: input.role,
  });

  // Invalidate member list cache on successful role update
  if (!result[0] && result[1]) {
    const eventId = result[1].eventId;
    updateTag(`event-${eventId}`);
    updateTag(`event-${eventId}-members`);
  }

  return result;
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
  const result = await removeMemberFromEvent({
    membershipId: input.memberId,
  });

  // Invalidate member list cache on successful removal
  if (!result[0] && result[1] && 'eventId' in result[1] && result[1].eventId) {
    const eventId = result[1].eventId;
    updateTag(`event-${eventId}`);
    updateTag(`event-${eventId}-members`);
  }

  return result;
}

/**
 * Update current user's RSVP status for an event
 * Returns: [error, MembershipData] tuple
 */
export async function updateRSVPAction(
  input: UpdateRSVPInput
): Promise<ResultTuple<MembershipMutationError, MembershipData>> {
  const result = await updateMemberRSVP({
    eventId: input.eventId,
    rsvpStatus: input.status,
  });

  // Invalidate member list and header cache on successful RSVP update
  if (!result[0]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-members`);
    updateTag(`event-${input.eventId}-header`);
  }

  return result;
}

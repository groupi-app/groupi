import { Effect } from 'effect';
import { z } from 'zod';
import { db } from './db';
import { safeWrapper } from './shared/safe-wrapper';
import { $Enums, Membership } from '@prisma/client';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getPersonQuery } from '@groupi/schema/queries';

import { createEventModNotifs, createNotification } from './notification';
import { SentryHelpers } from './sentry';
import { OperationSuccessSchema } from './shared/operations';

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for membership operation results
export const MembershipOperationResultSchema = z.object({
  message: z.string(),
  membership: z.any(), // TODO: Create proper Membership schema
});

// Schema for RSVP operation results
export const RSVPOperationResultSchema = z.object({
  message: z.string(),
  membership: z.any(), // TODO: Create proper Membership schema
});

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
} from './shared/effect-patterns';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class MemberNotFoundError extends Error {
  readonly _tag = 'MemberNotFoundError';
  constructor(userId: string, eventId: string) {
    super(`Member not found: user ${userId} in event ${eventId}`);
  }
}

export class UnauthorizedMemberError extends Error {
  readonly _tag = 'UnauthorizedMemberError';
  constructor(message: string) {
    super(message);
  }
}

export class MemberUpdateError extends Error {
  readonly _tag = 'MemberUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update member');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class MemberDeletionError extends Error {
  readonly _tag = 'MemberDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete member');
    if (cause) {
      this.cause = cause;
    }
  }
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to update membership role
export const updateMembershipRoleEffect = (
  membership: Membership,
  role: $Enums.Role,
  currentUserId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Find current user membership to check permissions (database operation with retry)
      const currentUserMembership = yield* _(
        dbOperation(
          () =>
            db.membership.findFirst({
              where: {
                personId: currentUserId,
                eventId: membership.eventId,
              },
            }),
          _error => new MemberUpdateError('Failed to find membership'),
          `Find current user membership for role update: ${membership.eventId}`
        )
      );

      if (!currentUserMembership) {
        return yield* _(
          Effect.fail(
            new UnauthorizedMemberError('You are not a member of this event')
          )
        );
      }

      // Check permissions (business logic - no retry)
      if (currentUserMembership.role !== 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new UnauthorizedMemberError('Only organizers can update roles')
          )
        );
      }

      if (membership.role === 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new UnauthorizedMemberError('Organizer role cannot be updated')
          )
        );
      }

      // Update the membership role (database operation with retry)
      const updatedMembership = yield* _(
        dbOperation(
          () =>
            db.membership.update({
              where: { id: membership.id },
              data: { role: role },
            }),
          _error => new MemberUpdateError('Failed to update membership role'),
          `Update membership role: ${membership.id} to ${role}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const queryDefinition = getEventQuery(membership.eventId);
            return getPusherServer().trigger(
              queryDefinition.pusherChannel,
              queryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error =>
            new MemberUpdateError('Failed to send pusher notifications'),
          `Send pusher notifications for role update: ${membership.id}`
        )
      );

      // Create role change notifications (external service - retry with graceful degradation)
      if (role === 'MODERATOR') {
        yield* _(
          externalServiceOperation(
            async () => {
              const [error, result] = await createNotification(
                {
                  type: 'USER_PROMOTED',
                  personId: membership.personId,
                  eventId: membership.eventId,
                  authorId: currentUserId,
                  datetime: null,
                  postId: null,
                  read: false,
                  rsvp: null,
                },
                currentUserId
              );
              if (error) throw error;
              return result;
            },
            _error => new Error('Failed to create promotion notification'),
            `Create promotion notification for user: ${membership.personId}`
          )
        );
      } else if (role === 'ATTENDEE') {
        yield* _(
          externalServiceOperation(
            async () => {
              const [error, result] = await createNotification(
                {
                  type: 'USER_DEMOTED',
                  personId: membership.personId,
                  eventId: membership.eventId,
                  authorId: currentUserId,
                  datetime: null,
                  postId: null,
                  read: false,
                  rsvp: null,
                },
                currentUserId
              );
              if (error) throw error;
              return result;
            },
            _error => new Error('Failed to create demotion notification'),
            `Create demotion notification for user: ${membership.personId}`
          )
        );
      }

      return { message: 'Role Updated', membership: updatedMembership };
    }),
    'member',
    'updateMembershipRole',
    membership.id
  );

// Modernized Effect-based function to delete membership
export const deleteMembershipEffect = (
  membership: Membership,
  currentUserId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Find current user membership to check permissions (database operation with retry)
      const currentUserMembership = yield* _(
        dbOperation(
          () =>
            db.membership.findFirst({
              where: {
                personId: currentUserId,
                eventId: membership.eventId,
              },
            }),
          _error => new MemberDeletionError('Failed to fetch membership'),
          `Find current user membership for deletion: ${membership.eventId}`
        )
      );

      if (!currentUserMembership) {
        return yield* _(
          Effect.fail(
            new UnauthorizedMemberError('You are not a member of this event')
          )
        );
      }

      // Check permissions (business logic - no retry)
      if (currentUserMembership.role === 'ATTENDEE') {
        return yield* _(
          Effect.fail(
            new UnauthorizedMemberError(
              'Only moderators and organizers can kick members'
            )
          )
        );
      }

      if (membership.role === 'ORGANIZER') {
        return yield* _(
          Effect.fail(new UnauthorizedMemberError('Cannot kick organizer'))
        );
      }

      if (
        membership.role === 'MODERATOR' &&
        currentUserMembership.role === 'MODERATOR'
      ) {
        return yield* _(
          Effect.fail(
            new UnauthorizedMemberError(
              'Only the organizer can kick a moderator'
            )
          )
        );
      }

      // Delete the membership (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.membership.delete({
              where: { id: membership.id },
            }),
          _error => new MemberDeletionError('Failed to delete membership'),
          `Delete membership: ${membership.id}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const eventQueryDefinition = getEventQuery(membership.eventId);
            const personQueryDefinition = getPersonQuery(membership.personId);

            return Promise.all([
              getPusherServer().trigger(
                eventQueryDefinition.pusherChannel,
                eventQueryDefinition.pusherEvent,
                { message: 'Data updated' }
              ),
              getPusherServer().trigger(
                personQueryDefinition.pusherChannel,
                personQueryDefinition.pusherEvent,
                { message: 'Data updated' }
              ),
            ]);
          },
          _error =>
            new MemberUpdateError('Failed to send pusher notifications'),
          `Send pusher notifications for membership deletion: ${membership.id}`
        )
      );

      return { message: 'Membership Deleted' };
    }),
    'member',
    'deleteMembership',
    membership.id
  );

// Modernized Effect-based function to update RSVP status
export const updateRSVPEffect = (
  eventId: string,
  status: $Enums.Status,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Find user membership (database operation with retry)
      const membership = yield* _(
        dbOperation(
          () =>
            db.membership.findFirst({
              where: {
                personId: userId,
                eventId: eventId,
              },
            }),
          _error => new MemberUpdateError('Failed to find membership'),
          `Find user membership for RSVP update: ${eventId}`
        )
      );

      if (!membership) {
        return yield* _(Effect.fail(new MemberNotFoundError(userId, eventId)));
      }

      // Check permissions (business logic - no retry)
      if (membership.role === 'ORGANIZER') {
        return yield* _(
          Effect.fail(new UnauthorizedMemberError('Organizer cannot RSVP'))
        );
      }

      // Update RSVP status (database operation with retry)
      const updatedMembership = yield* _(
        dbOperation(
          () =>
            db.membership.update({
              where: { id: membership.id },
              data: { rsvpStatus: status },
            }),
          _error => new MemberUpdateError('Failed to update RSVP status'),
          `Update RSVP status for membership: ${membership.id} to ${status}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const queryDefinition = getEventQuery(eventId);
            return getPusherServer().trigger(
              queryDefinition.pusherChannel,
              queryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error =>
            new MemberUpdateError('Failed to send pusher notifications'),
          `Send pusher notifications for RSVP update: ${eventId}`
        )
      );

      // Create RSVP notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          async () => {
            const [error, result] = await createEventModNotifs(
              eventId,
              'USER_RSVP',
              userId,
              status
            );
            if (error) throw error;
            return result;
          },
          _error => new Error('Failed to create RSVP notifications'),
          `Create RSVP notifications for event: ${eventId}`
        )
      );

      return { message: 'RSVP Updated', membership: updatedMembership };
    }),
    'member',
    'updateRSVP',
    eventId
  );

// ============================================================================
// SAFE WRAPPER FUNCTIONS (Public API)
// ============================================================================

export const updateMembershipRole = safeWrapper<
  [Membership, $Enums.Role, string],
  z.infer<typeof MembershipOperationResultSchema>,
  MemberNotFoundError | UnauthorizedMemberError | MemberUpdateError
>(async (membership: Membership, role: $Enums.Role, currentUserId: string) => {
  const result = await Effect.runPromise(
    updateMembershipRoleEffect(membership, role, currentUserId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateEventQueries, invalidatePersonQueries }) => {
      // Invalidate event member data for all event members
      invalidateEventQueries(membership.eventId, 'event.member.added', {
        eventId: membership.eventId,
        memberId: membership.personId,
        newRole: role,
        updatedBy: currentUserId,
      });
      // Also invalidate personal data for the affected user
      invalidatePersonQueries([membership.personId], 'membership.updated', {
        eventId: membership.eventId,
        newRole: role,
        updatedBy: currentUserId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, MembershipOperationResultSchema);

export const deleteMembership = safeWrapper<
  [Membership, string],
  z.infer<typeof OperationSuccessSchema>,
  MemberNotFoundError | UnauthorizedMemberError | MemberDeletionError
>(async (membership: Membership, currentUserId: string) => {
  const result = await Effect.runPromise(
    deleteMembershipEffect(membership, currentUserId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ handleMemberLeftEvent }) => {
      handleMemberLeftEvent(membership.eventId, membership.personId, {
        action: 'kicked',
        kickedBy: currentUserId,
        eventId: membership.eventId,
        userId: membership.personId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, OperationSuccessSchema);

export const updateRSVP = safeWrapper<
  [string, $Enums.Status, string],
  z.infer<typeof RSVPOperationResultSchema>,
  MemberNotFoundError | UnauthorizedMemberError | MemberUpdateError
>(async (eventId: string, status: $Enums.Status, userId: string) => {
  const result = await Effect.runPromise(
    updateRSVPEffect(eventId, status, userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateEventQueries }) => {
      invalidateEventQueries(eventId, 'event.member.added', {
        eventId,
        memberId: userId,
        rsvpStatus: status,
        action: 'rsvp_updated',
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, RSVPOperationResultSchema);

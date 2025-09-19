import { Effect } from 'effect';
import { z } from 'zod';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getInviteQuery } from '@groupi/schema/queries';
import { createEventModNotifs } from './notification';
import { SentryHelpers } from './sentry';
import { safeWrapper } from './shared/safe-wrapper';
import {
  createEventInviteManagementDTO,
  PrismaEventWithInvites,
  createIndividualInviteDTO,
  EventInviteManagementDTO,
  IndividualInviteDTO,
} from '@groupi/schema';

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
} from './shared/effect-patterns';
import { OperationSuccessSchema } from './shared/operations';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class InviteNotFoundError extends Error {
  readonly _tag = 'InviteNotFoundError';
  constructor(inviteId: string) {
    super(`Invite not found: ${inviteId}`);
  }
}

export class InviteUserNotFoundError extends Error {
  readonly _tag = 'InviteUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class InviteUnauthorizedError extends Error {
  readonly _tag = 'InviteUnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}

export class InviteCreationError extends Error {
  readonly _tag = 'InviteCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create invite');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class InviteDeletionError extends Error {
  readonly _tag = 'InviteDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete invite');
    if (cause) {
      this.cause = cause;
    }
  }
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to get event invite data
export const getEventInviteDataEffect = (eventId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with invites and memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                invites: {
                  include: {
                    createdBy: {
                      include: {
                        person: true,
                      },
                    },
                  },
                },
                memberships: true,
              },
            }),
          _error => new InviteNotFoundError(eventId),
          `Fetch event invite data for event: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new InviteNotFoundError(eventId)));
      }

      // Check if user is a member (business logic - no retry)
      const membership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!membership) {
        return yield* _(
          Effect.fail(
            new InviteUnauthorizedError('You are not a member of this event')
          )
        );
      }

      if (membership.role === 'ATTENDEE') {
        return yield* _(
          Effect.fail(
            new InviteUnauthorizedError(
              'You do not have permission to view this page'
            )
          )
        );
      }

      // Transform to DTO
      const eventDTO = createEventInviteManagementDTO(
        event as PrismaEventWithInvites
      );

      return eventDTO;
    }),
    'invite',
    'getEventInviteData',
    eventId
  );

// Modernized Effect-based function to fetch individual invite data
export const fetchInviteDataEffect = (inviteId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch invite with event and creator (database operation with retry)
      const invite = yield* _(
        dbOperation(
          () =>
            db.invite.findUnique({
              where: { id: inviteId },
              include: {
                event: {
                  include: {
                    memberships: true,
                  },
                },
                createdBy: {
                  include: {
                    person: true,
                  },
                },
              },
            }),
          _error => new InviteNotFoundError(inviteId),
          `Fetch invite data: ${inviteId}`
        )
      );

      if (!invite) {
        return yield* _(Effect.fail(new InviteNotFoundError(inviteId)));
      }

      // Transform to DTO
      const inviteDTO = createIndividualInviteDTO(
        invite as Parameters<typeof createIndividualInviteDTO>[0]
      );

      return inviteDTO;
    }),
    'invite',
    'fetchInviteData',
    inviteId
  );

// Modernized Effect-based function to create an invite
export const createInviteEffect = (
  inviteData: {
    name?: string;
    eventId: string;
    maxUses: number | null;
    expiresAt: Date | null;
  },
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
                eventId: inviteData.eventId,
              },
            }),
          _error => new InviteCreationError(_error),
          `Find user membership for invite creation: ${inviteData.eventId}`
        )
      );

      if (!membership || membership.role === 'ATTENDEE') {
        return yield* _(
          Effect.fail(
            new InviteUnauthorizedError(
              'You do not have permission to create invites'
            )
          )
        );
      }

      // Create the invite (database operation with retry)
      const invite = yield* _(
        dbOperation(
          () =>
            db.invite.create({
              data: {
                name: inviteData.name,
                eventId: inviteData.eventId,
                createdById: membership.id,
                expiresAt: inviteData.expiresAt,
                usesRemaining: inviteData.maxUses,
                maxUses: inviteData.maxUses,
              },
            }),
          _error => new InviteCreationError(_error),
          `Create invite for event: ${inviteData.eventId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const queryDefinition = getInviteQuery(inviteData.eventId);
            return getPusherServer().trigger(
              queryDefinition.pusherChannel,
              queryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for invite creation: ${invite.id}`
        )
      );

      return invite;
    }),
    'invite',
    'createInvite',
    inviteData.eventId
  );

// Modernized Effect-based function to delete an invite
export const deleteInviteEffect = (inviteId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch invite with event and memberships (database operation with retry)
      const invite = yield* _(
        dbOperation(
          () =>
            db.invite.findUnique({
              where: { id: inviteId },
              include: {
                event: {
                  include: {
                    memberships: true,
                  },
                },
              },
            }),
          _error => new InviteDeletionError(_error),
          `Fetch invite for deletion: ${inviteId}`
        )
      );

      if (!invite) {
        return yield* _(Effect.fail(new InviteNotFoundError(inviteId)));
      }

      // Check permissions (business logic - no retry)
      const membership = invite.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!membership || membership.role === 'ATTENDEE') {
        return yield* _(
          Effect.fail(
            new InviteUnauthorizedError(
              'You do not have permission to delete this invite'
            )
          )
        );
      }

      // Delete the invite (database operation with retry)
      yield* _(
        dbOperation(
          () => db.invite.delete({ where: { id: inviteId } }),
          _error => new InviteDeletionError(_error),
          `Delete invite: ${inviteId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const queryDefinition = getInviteQuery(invite.eventId);
            return getPusherServer().trigger(
              queryDefinition.pusherChannel,
              queryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for invite deletion: ${inviteId}`
        )
      );

      return { message: 'Invite Deleted' };
    }),
    'invite',
    'deleteInvite',
    inviteId
  );

// Modernized Effect-based function to delete multiple invites
export const deleteInvitesEffect = (inviteIds: string[], userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch invites with event and memberships (database operation with retry)
      const invites = yield* _(
        dbOperation(
          () =>
            db.invite.findMany({
              where: { id: { in: inviteIds } },
              include: {
                event: {
                  include: {
                    memberships: true,
                  },
                },
              },
            }),
          _error => new InviteDeletionError(_error),
          `Fetch invites for deletion: ${inviteIds.join(', ')}`
        )
      );

      if (!invites || invites.length === 0) {
        return yield* _(
          Effect.fail(new InviteNotFoundError('Multiple invites'))
        );
      }

      // Check permissions (using first invite's event) (business logic - no retry)
      const membership = invites[0].event.memberships.find(
        membership => membership.personId === userId
      );

      if (!membership || membership.role === 'ATTENDEE') {
        return yield* _(
          Effect.fail(
            new InviteUnauthorizedError(
              'You do not have permission to delete these invites'
            )
          )
        );
      }

      // Delete the invites (database operation with retry)
      yield* _(
        dbOperation(
          () => db.invite.deleteMany({ where: { id: { in: inviteIds } } }),
          _error => new InviteDeletionError(_error),
          `Delete multiple invites: ${inviteIds.join(', ')}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const queryDefinition = getInviteQuery(invites[0].eventId);
            return getPusherServer().trigger(
              queryDefinition.pusherChannel,
              queryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for invite deletion: ${inviteIds.join(', ')}`
        )
      );

      return { message: 'Invites Deleted' };
    }),
    'invite',
    'deleteInvites',
    inviteIds.join(',')
  );

// Modernized Effect-based function to accept an invite
export const acceptInviteEffect = (inviteId: string, personId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch invite (database operation with retry)
      const invite = yield* _(
        dbOperation(
          () =>
            db.invite.findUnique({
              where: { id: inviteId },
            }),
          _error => new InviteNotFoundError(inviteId),
          `Fetch invite for acceptance: ${inviteId}`
        )
      );

      if (!invite) {
        return yield* _(Effect.fail(new InviteNotFoundError(inviteId)));
      }

      // Check if invite has expired (business logic - no retry)
      if (
        invite.expiresAt !== null &&
        new Date().getTime() > invite.expiresAt.getTime()
      ) {
        return yield* _(Effect.fail(new Error('Invite has expired')));
      }

      // Check if invite is out of uses (business logic - no retry)
      if (invite.usesRemaining !== null && invite.usesRemaining < 1) {
        return yield* _(Effect.fail(new Error('Invite is out of uses')));
      }

      // Check if membership already exists (database operation with retry)
      const currentMembership = yield* _(
        dbOperation(
          () =>
            db.membership.findFirst({
              where: {
                personId: personId,
                eventId: invite.eventId,
              },
            }),
          _error => new Error('Failed to check membership'),
          `Check existing membership for invite acceptance: ${inviteId}`
        )
      );

      if (currentMembership) {
        return yield* _(Effect.fail(new Error('Membership already exists')));
      }

      // Create membership (database operation with retry)
      const membership = yield* _(
        dbOperation(
          () =>
            db.membership.create({
              data: {
                personId: personId,
                eventId: invite.eventId,
              },
            }),
          _error => new Error('Failed to create membership'),
          `Create membership for invite acceptance: ${inviteId}`
        )
      );

      // Decrement remaining uses (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.invite.update({
              where: { id: inviteId },
              data: { usesRemaining: { decrement: 1 } },
            }),
          _error => new Error('Failed to update invite uses'),
          `Update invite uses for acceptance: ${inviteId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const inviteQueryDefinition = getInviteQuery(invite.eventId);
            const eventQueryDefinition = getEventQuery(invite.eventId);

            return Promise.all([
              getPusherServer().trigger(
                inviteQueryDefinition.pusherChannel,
                inviteQueryDefinition.pusherEvent,
                { message: 'Data updated' }
              ),
              getPusherServer().trigger(
                eventQueryDefinition.pusherChannel,
                eventQueryDefinition.pusherEvent,
                { message: 'Data updated' }
              ),
            ]);
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for invite acceptance: ${inviteId}`
        )
      );

      // Create event notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          async () => {
            const [error, result] = await createEventModNotifs(
              invite.eventId,
              'USER_JOINED',
              personId
            );
            if (error) throw error;
            return result;
          },
          _error => new Error('Failed to create event notifications'),
          `Create event notifications for invite acceptance: ${inviteId}`
        )
      );

      return {
        message: 'Invite successfully used',
        membershipId: membership.id,
      };
    }),
    'invite',
    'acceptInvite',
    inviteId
  );

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for created invites
export const CreatedInviteSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  eventId: z.string(),
  createdById: z.string(),
  expiresAt: z.date().nullable(),
  usesRemaining: z.number().nullable(),
  maxUses: z.number().nullable(),
  createdAt: z.date(),
});

// Schema for accept invite response
export const AcceptInviteSchema = z.object({
  message: z.string(),
  membershipId: z.string(),
});

// Schema for invite data (using existing DTO)
export const InviteDataSchema = EventInviteManagementDTO;

// ============================================================================
// SAFE WRAPPERS WITH CUSTOM ERROR TYPES
// ============================================================================

export const getEventInviteData = safeWrapper<
  [string, string],
  z.infer<typeof InviteDataSchema>,
  InviteNotFoundError | InviteUnauthorizedError
>(
  (eventId: string, userId: string) =>
    Effect.runPromise(getEventInviteDataEffect(eventId, userId)),
  InviteDataSchema
);

export const fetchInviteData = safeWrapper<
  [string],
  z.infer<typeof IndividualInviteDTO>,
  InviteNotFoundError
>(
  (inviteId: string) => Effect.runPromise(fetchInviteDataEffect(inviteId)),
  IndividualInviteDTO
);

export const createInvite = safeWrapper<
  [
    {
      name?: string;
      eventId: string;
      maxUses: number | null;
      expiresAt: Date | null;
    },
    string,
  ],
  z.infer<typeof CreatedInviteSchema>,
  InviteUnauthorizedError | InviteCreationError
>(
  (
    inviteData: {
      name?: string;
      eventId: string;
      maxUses: number | null;
      expiresAt: Date | null;
    },
    userId: string
  ) => Effect.runPromise(createInviteEffect(inviteData, userId)),
  CreatedInviteSchema
);

export const deleteInvite = safeWrapper<
  [string, string],
  z.infer<typeof OperationSuccessSchema>,
  InviteNotFoundError | InviteUnauthorizedError | InviteDeletionError
>(
  (inviteId: string, userId: string) =>
    Effect.runPromise(deleteInviteEffect(inviteId, userId)),
  OperationSuccessSchema
);

export const deleteInvites = safeWrapper<
  [string[], string],
  z.infer<typeof OperationSuccessSchema>,
  InviteNotFoundError | InviteUnauthorizedError | InviteDeletionError
>(
  (inviteIds: string[], userId: string) =>
    Effect.runPromise(deleteInvitesEffect(inviteIds, userId)),
  OperationSuccessSchema
);

export const acceptInvite = safeWrapper<
  [string, string],
  z.infer<typeof AcceptInviteSchema>,
  InviteNotFoundError
>(
  (inviteId: string, personId: string) =>
    Effect.runPromise(acceptInviteEffect(inviteId, personId)),
  AcceptInviteSchema
);

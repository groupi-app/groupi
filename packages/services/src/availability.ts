import { Effect } from 'effect';
import { z } from 'zod';
import { $Enums } from '@prisma/client';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import {
  getEventQuery,
  getPDTQuery,
  getPersonQuery,
} from '@groupi/schema/queries';
import { createEventNotifs } from './notification';
import { SentryHelpers } from './sentry';
import {
  DateOptionDTO,
  createDateOptionDTO,
  PrismaPotentialDateTimeWithAvailabilities,
  RoleSchema,
} from '@groupi/schema';
import { safeWrapper } from './shared/safe-wrapper';

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
} from './shared/effect-patterns';
import { OperationSuccessSchema } from './shared/operations';

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for PDT data return type
export const PDTDataSchema = z.object({
  potentialDateTimes: z.array(DateOptionDTO),
  userRole: RoleSchema,
  userId: z.string(),
});

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AvailabilityNotFoundError extends Error {
  readonly _tag = 'AvailabilityNotFoundError';
  constructor(userId: string, eventId: string) {
    super(`Availability not found for user ${userId} in event ${eventId}`);
  }
}

export class AvailabilityEventNotFoundError extends Error {
  readonly _tag = 'AvailabilityEventNotFoundError';
  constructor(eventId: string) {
    super(`Event not found: ${eventId}`);
  }
}

export class AvailabilityUserNotMemberError extends Error {
  readonly _tag = 'AvailabilityUserNotMemberError';
  constructor(userId: string, eventId: string) {
    super(`User ${userId} is not a member of event ${eventId}`);
  }
}

export class UnauthorizedAvailabilityError extends Error {
  readonly _tag = 'UnauthorizedAvailabilityError';
  constructor(message: string) {
    super(message);
  }
}

export class AvailabilityUpdateError extends Error {
  readonly _tag = 'AvailabilityUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update availability');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class DateSelectionError extends Error {
  readonly _tag = 'DateSelectionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to select date');
    if (cause) {
      this.cause = cause;
    }
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PDTData = z.infer<typeof PDTDataSchema>;

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to get event potential date times
export const getEventPotentialDateTimesEffect = (
  eventId: string,
  userId: string
): Effect.Effect<
  PDTData,
  | AvailabilityNotFoundError
  | AvailabilityEventNotFoundError
  | AvailabilityUserNotMemberError
  | UnauthorizedAvailabilityError,
  never
> =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with potential date times and memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                potentialDateTimes: {
                  include: {
                    availabilities: {
                      include: {
                        membership: {
                          include: {
                            person: true,
                          },
                        },
                      },
                    },
                    event: {
                      include: {
                        memberships: {
                          include: {
                            availabilities: true,
                          },
                        },
                      },
                    },
                  },
                },
                memberships: true,
              },
            }),
          _error => new AvailabilityEventNotFoundError(eventId),
          `Fetch event potential date times: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(
          Effect.fail(new AvailabilityEventNotFoundError(eventId))
        );
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new AvailabilityUserNotMemberError(userId, eventId))
        );
      }

      if (event.chosenDateTime) {
        return yield* _(
          Effect.fail(
            new UnauthorizedAvailabilityError(
              'A date has already been chosen for this event'
            )
          )
        );
      }

      // Transform to DTOs
      const potentialDateTimesDTO = event.potentialDateTimes.map(pdt =>
        createDateOptionDTO(pdt as PrismaPotentialDateTimeWithAvailabilities)
      );

      return {
        potentialDateTimes: potentialDateTimesDTO,
        userId: userId,
        userRole: userMembership.role,
      };
    }),
    'availability',
    'getEventPotentialDateTimes',
    eventId
  );

// Modernized Effect-based function to update membership availabilities
export const updateMembershipAvailabilitiesEffect = (
  eventId: string,
  availabilityUpdates: {
    potentialDateTimeId: string;
    status: 'YES' | 'NO' | 'MAYBE';
  }[],
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships and availabilities (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                memberships: {
                  include: {
                    availabilities: true,
                  },
                },
              },
            }),
          _error => new AvailabilityUpdateError(_error),
          `Fetch event for availability update: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(
          Effect.fail(new AvailabilityEventNotFoundError(eventId))
        );
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new AvailabilityUserNotMemberError(userId, eventId))
        );
      }

      // Get existing availabilities for the user
      const existingAvailabilities = event.memberships.find(
        m => m.personId === userId
      )?.availabilities;

      if (existingAvailabilities && existingAvailabilities.length > 0) {
        // Update existing availabilities (database operation with retry)
        for (const update of availabilityUpdates) {
          yield* _(
            dbOperation(
              () =>
                db.availability.updateMany({
                  where: {
                    membershipId: userMembership.id,
                    potentialDateTimeId: update.potentialDateTimeId,
                  },
                  data: {
                    status: update.status,
                  },
                }),
              _error => new AvailabilityUpdateError(_error),
              `Update availability for PDT: ${update.potentialDateTimeId}`
            )
          );
        }
      } else {
        // Create new availabilities (database operation with retry)
        yield* _(
          dbOperation(
            () =>
              db.availability.createMany({
                data: availabilityUpdates.map(update => ({
                  status: update.status,
                  membershipId: userMembership.id,
                  potentialDateTimeId: update.potentialDateTimeId,
                })),
              }),
            _error => new AvailabilityUpdateError(_error),
            `Create new availabilities for event: ${eventId}`
          )
        );
      }

      // Send pusher notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const eventQueryDefinition = getPDTQuery(eventId);
            return getPusherServer().trigger(
              eventQueryDefinition.pusherChannel,
              eventQueryDefinition.pusherEvent,
              { message: 'Event data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for availability update: ${eventId}`
        )
      );

      return { message: 'Availability updated successfully' };
    }),
    'availability',
    'updateMembershipAvailabilities',
    eventId
  );

// Modernized Effect-based function to choose date time
export const chooseDateTimeEffect = (
  eventId: string,
  pdtId: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch potential date time with event and memberships (database operation with retry)
      const pdt = yield* _(
        dbOperation(
          () =>
            db.potentialDateTime.findUnique({
              where: { id: pdtId },
              include: {
                event: {
                  include: {
                    memberships: true,
                  },
                },
              },
            }),
          _error => new DateSelectionError(_error),
          `Fetch potential date time for selection: ${pdtId}`
        )
      );

      if (!pdt || pdt.eventId !== eventId) {
        return yield* _(
          Effect.fail(new AvailabilityNotFoundError(userId, eventId))
        );
      }

      // Check if user is organizer (business logic - no retry)
      const userMembership = pdt.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new AvailabilityUserNotMemberError(userId, eventId))
        );
      }

      if (userMembership.role !== 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new UnauthorizedAvailabilityError(
              'Only organizers can choose dates'
            )
          )
        );
      }

      // Update event with chosen date time (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.event.update({
              where: { id: eventId },
              data: {
                chosenDateTime: pdt.dateTime,
              },
            }),
          _error => new DateSelectionError(_error),
          `Update event with chosen date time: ${eventId}`
        )
      );

      // Reset member RSVP statuses (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.membership.updateMany({
              where: {
                eventId,
                role: { not: 'ORGANIZER' },
              },
              data: {
                rsvpStatus: 'PENDING',
              },
            }),
          _error => new AvailabilityUpdateError(_error),
          `Reset RSVP statuses for event: ${eventId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(eventId);
      const events = [
        {
          channel: eventQueryDefinition.pusherChannel,
          name: eventQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        },
      ];

      for (const membership of pdt.event.memberships) {
        const personQueryDefinition = getPersonQuery(membership.personId);
        events.push({
          channel: personQueryDefinition.pusherChannel,
          name: personQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        });
      }

      if (events.length > 0) {
        yield* _(
          externalServiceOperation(
            () => getPusherServer().triggerBatch(events),
            _error => new Error('Failed to send pusher notifications'),
            `Send pusher notifications for date selection: ${eventId}`
          )
        );
      }

      // Create event notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          async () => {
            const [error, result] = await createEventNotifs(
              eventId,
              'DATE_CHANGED',
              userId,
              undefined,
              pdt.dateTime
            );
            if (error) throw error;
            return result;
          },
          _error => new Error('Failed to create event notifications'),
          `Create date change notifications for event: ${eventId}`
        )
      );

      return { message: 'Date chosen successfully' };
    }),
    'availability',
    'chooseDateTime',
    eventId
  );

// ============================================================================
// SAFE WRAPPERS WITH CUSTOM ERROR TYPES
// ============================================================================

export const getEventPotentialDateTimes = safeWrapper<
  [string, string],
  z.infer<typeof PDTDataSchema>,
  | AvailabilityNotFoundError
  | AvailabilityEventNotFoundError
  | AvailabilityUserNotMemberError
  | UnauthorizedAvailabilityError
>(
  async (eventId: string, userId: string) =>
    Effect.runPromise(getEventPotentialDateTimesEffect(eventId, userId)),
  PDTDataSchema
);

export const updateMembershipAvailabilities = safeWrapper(
  async (
    eventId: string,
    availabilityUpdates: {
      potentialDateTimeId: string;
      status: 'YES' | 'NO' | 'MAYBE';
    }[],
    userId: string
  ) =>
    Effect.runPromise(
      updateMembershipAvailabilitiesEffect(eventId, availabilityUpdates, userId)
    ),
  OperationSuccessSchema
);

export const chooseDateTime = safeWrapper(
  async (eventId: string, pdtId: string, userId: string) =>
    Effect.runPromise(chooseDateTimeEffect(eventId, pdtId, userId)),
  OperationSuccessSchema
);

import { BatchEvent } from 'pusher';
import { Effect } from 'effect';
import { z } from 'zod';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { createEventNotifsEffect } from './notification';
import { SentryHelpers } from './sentry';
import { safeWrapper } from './shared/safe-wrapper';

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
} from './shared/effect-patterns';

import {
  getEventQuery,
  getPersonQuery,
  EventDetailsDTO,
  EventPageDTO,
  CreateEventInput,
  UpdateEventDetailsInput,
  createEventPageDTO,
  createEventDetailsDTO,
  EventMemberAvailabilityDTO,
  createEventMemberAvailabilityDTO,
  PrismaEventWithMembers,
  PrismaMembershipWithAvailabilities,
  Event,
  Membership,
  PotentialDateTime,
  EventSchema,
} from '@groupi/schema';
import { OperationSuccessSchema } from './shared/operations';

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for EventData return type
export const EventDataSchema = z.object({
  event: EventDetailsDTO,
  userMembership: EventMemberAvailabilityDTO,
  userId: z.string(),
});

// Schema for EventDataWithPosts return type
export const EventDataWithPostsSchema = z.object({
  event: EventPageDTO,
  userMembership: EventMemberAvailabilityDTO,
  userId: z.string(),
});

// Schema for created events (Event with memberships)
export const CreatedEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  chosenDateTime: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  memberships: z.array(
    z.object({
      id: z.string(),
      personId: z.string(),
      eventId: z.string(),
      role: z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']),
      rsvpStatus: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']),
    })
  ),
});

// ============================================================================
// ERROR TYPES
// ============================================================================

export class EventNotFoundError extends Error {
  readonly _tag = 'EventNotFoundError';
  constructor(eventId: string) {
    super(`Event not found: ${eventId}`);
  }
}

export class EventUserNotFoundError extends Error {
  readonly _tag = 'EventUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class EventUserNotMemberError extends Error {
  readonly _tag = 'EventUserNotMemberError';
  constructor(eventId: string, userId: string) {
    super(`User ${userId} is not a member of event ${eventId}`);
  }
}

export class EventCreationError extends Error {
  readonly _tag = 'EventCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create event');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class EventUpdateError extends Error {
  readonly _tag = 'EventUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update event');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class EventDeletionError extends Error {
  readonly _tag = 'EventDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete event');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class EventUnauthorizedError extends Error {
  readonly _tag = 'EventUnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Internal return types (not exported to schema package as they're service-specific combinations)
interface EventData {
  event: EventDetailsDTO;
  userMembership: EventMemberAvailabilityDTO;
  userId: string;
}

interface EventDataWithPosts {
  event: EventPageDTO;
  userMembership: EventMemberAvailabilityDTO;
  userId: string;
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to fetch event data (no posts)
export const fetchEventDataEffect = (eventId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with all related data (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                memberships: {
                  include: {
                    person: true,
                    availabilities: {
                      include: {
                        potentialDateTime: true,
                      },
                    },
                    event: true,
                  },
                },
              },
            }),
          _error => new EventNotFoundError(eventId),
          `Fetch event data for event ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventId)));
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new EventUserNotMemberError(eventId, userId))
        );
      }

      // Transform to DTOs
      const eventDTO = createEventDetailsDTO(
        event as PrismaEventWithMembers,
        userId
      );
      const userMembershipDTO = createEventMemberAvailabilityDTO(
        userMembership as PrismaMembershipWithAvailabilities
      );

      return {
        event: eventDTO,
        userMembership: userMembershipDTO,
        userId,
      };
    }),
    'event',
    'fetchData',
    eventId
  );

// Modernized Effect-based function to fetch event page data (includes posts)
export const fetchEventPageDataEffect = (eventId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with all related data including posts (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                posts: {
                  include: {
                    replies: {
                      include: {
                        author: true,
                      },
                    },
                    author: true,
                  },
                },
                memberships: {
                  include: {
                    person: true,
                    availabilities: {
                      include: {
                        potentialDateTime: true,
                      },
                    },
                    event: true,
                  },
                },
              },
            }),
          _error => new EventNotFoundError(eventId),
          `Fetch event page data for event ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventId)));
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new EventUserNotMemberError(eventId, userId))
        );
      }

      // Transform to DTOs
      const eventDTO = createEventPageDTO(event, userId);
      const userMembershipDTO = createEventMemberAvailabilityDTO(
        userMembership as PrismaMembershipWithAvailabilities
      );

      return {
        event: eventDTO,
        userMembership: userMembershipDTO,
        userId,
      };
    }),
    'event',
    'fetchPageData',
    eventId
  );

// Modernized Effect-based function to create event
export const createEventEffect = (
  eventData: CreateEventInput,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Create the event (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.create({
              data: {
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                chosenDateTime: eventData.dateTime,
                memberships: {
                  create: {
                    personId: userId,
                    role: 'ORGANIZER',
                    rsvpStatus: 'YES',
                  },
                },
              },
              include: {
                memberships: true,
              },
            }),
          _error => new EventCreationError(_error),
          `Create event: ${eventData.title}`
        )
      );

      // Add potential date times if provided (database operation with retry)
      if (
        eventData.potentialDateTimes &&
        eventData.potentialDateTimes.length > 0
      ) {
        const updatedEvent = yield* _(
          dbOperation(
            () =>
              db.event.update({
                where: { id: event.id },
                data: {
                  potentialDateTimes: {
                    createMany: {
                      data: eventData.potentialDateTimes!.map(dateTime => ({
                        dateTime,
                      })),
                    },
                  },
                },
                include: {
                  potentialDateTimes: true,
                },
              }),
            _error => new EventCreationError(_error),
            `Add potential dates to event ${event.id}`
          )
        );

        // Create initial availabilities for the organizer (database operation with retry)
        if (updatedEvent.potentialDateTimes) {
          yield* _(
            dbOperation(
              () =>
                db.availability.createMany({
                  data: updatedEvent.potentialDateTimes.map(pdt => ({
                    membershipId: event.memberships[0].id,
                    status: 'YES',
                    potentialDateTimeId: pdt.id,
                  })),
                }),
              _error => new EventCreationError(_error),
              `Create initial availabilities for event ${event.id}`
            )
          );
        }
      }

      return event;
    }),
    'event',
    'create',
    undefined
  );

// Modernized Effect-based function to update event details
export const updateEventDetailsEffect = (
  eventData: UpdateEventDetailsInput,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventData.id },
              include: {
                memberships: true,
                potentialDateTimes: true,
              },
            }),
          _error => new EventNotFoundError(eventData.id),
          `Fetch event for update: ${eventData.id}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventData.id)));
      }

      // Check if user is a member and has permission (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new EventUserNotMemberError(eventData.id, userId))
        );
      }

      if (userMembership.role !== 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new EventUnauthorizedError(
              'You do not have permission to edit this event'
            )
          )
        );
      }

      // Update the event (database operation with retry)
      const updatedEvent = yield* _(
        dbOperation(
          () =>
            db.event.update({
              where: { id: eventData.id },
              data: {
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                updatedAt: new Date(),
              },
            }),
          _error => new EventUpdateError(_error),
          `Update event details: ${eventData.id}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(eventData.id);
      const events: BatchEvent[] = [
        {
          channel: eventQueryDefinition.pusherChannel,
          name: eventQueryDefinition.pusherEvent,
          data: { message: 'Event Data updated' },
        },
      ];

      for (const membership of event.memberships) {
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
            `Send pusher notifications for event update: ${eventData.id}`
          )
        );
      }

      // Send event notifications using Effect version (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () =>
            Effect.runPromise(
              createEventNotifsEffect(eventData.id, 'EVENT_EDITED', userId)
            ),
          _error => new Error('Failed to create event notifications'),
          `Create event notifications for event: ${eventData.id}`
        )
      );

      return updatedEvent;
    }),
    'event',
    'updateDetails',
    eventData.id
  );

// Modernized Effect-based function to update event date/time
export const updateEventDateTimeEffect = (
  eventId: string,
  dateTime: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                memberships: true,
              },
            }),
          _error => new EventNotFoundError(eventId),
          `Fetch event for date update: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventId)));
      }

      // Check permissions (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new EventUserNotMemberError(eventId, userId))
        );
      }

      if (userMembership.role !== 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new EventUnauthorizedError(
              'You do not have permission to edit this event'
            )
          )
        );
      }

      // Update the event (database operation with retry)
      const updatedEvent = yield* _(
        dbOperation(
          () =>
            db.event.update({
              where: { id: eventId },
              data: {
                chosenDateTime: dateTime,
              },
            }),
          error => new EventUpdateError(error),
          `Update event date/time: ${eventId}`
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
          error => new EventUpdateError(error),
          `Reset RSVP statuses for event: ${eventId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(eventId);
      const events: BatchEvent[] = [
        {
          channel: eventQueryDefinition.pusherChannel,
          name: eventQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        },
      ];

      for (const membership of event.memberships) {
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
            `Send pusher notifications for date update: ${eventId}`
          )
        );
      }

      // Send event notifications using Effect version (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () =>
            Effect.runPromise(
              createEventNotifsEffect(
                eventId,
                'DATE_CHANGED',
                userId,
                undefined,
                new Date(dateTime)
              )
            ),
          _error => new Error('Failed to create event notifications'),
          `Create date change notifications for event: ${eventId}`
        )
      );

      return updatedEvent;
    }),
    'event',
    'updateDateTime',
    eventId
  );

// Modernized Effect-based function to update potential date times
export const updateEventPotentialDateTimesEffect = (
  eventId: string,
  potentialDateTimes: string[],
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships and potential date times (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                memberships: true,
                potentialDateTimes: true,
              },
            }),
          _error => new EventNotFoundError(eventId),
          `Fetch event for potential date times update: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventId)));
      }

      // Check permissions (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new EventUserNotMemberError(eventId, userId))
        );
      }

      if (userMembership.role !== 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new EventUnauthorizedError(
              'You do not have permission to edit this event'
            )
          )
        );
      }

      // Update the event with new potential date times (database operation with retry)
      const updatedEvent = yield* _(
        dbOperation(
          () =>
            db.event.update({
              where: { id: eventId },
              data: {
                potentialDateTimes: {
                  deleteMany: {},
                  createMany: {
                    data: potentialDateTimes.map(dateTime => ({
                      dateTime,
                    })),
                  },
                },
                chosenDateTime: null,
              },
              include: {
                potentialDateTimes: true,
              },
            }),
          error => new EventUpdateError(error),
          `Update potential date times for event: ${eventId}`
        )
      );

      // Create initial availabilities for the organizer (database operation with retry)
      if (updatedEvent.potentialDateTimes) {
        yield* _(
          dbOperation(
            () =>
              db.availability.createMany({
                data: updatedEvent.potentialDateTimes.map(pdt => ({
                  membershipId: userMembership.id,
                  status: 'YES',
                  potentialDateTimeId: pdt.id,
                })),
              }),
            error => new EventUpdateError(error),
            `Create organizer availabilities for event: ${eventId}`
          )
        );
      }

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
          error => new EventUpdateError(error),
          `Reset RSVP statuses for event: ${eventId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(eventId);
      const events: BatchEvent[] = [
        {
          channel: eventQueryDefinition.pusherChannel,
          name: eventQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        },
      ];

      for (const membership of event.memberships) {
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
            `Send pusher notifications for potential dates update: ${eventId}`
          )
        );
      }

      // Send event notifications using Effect version (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () =>
            Effect.runPromise(
              createEventNotifsEffect(eventId, 'DATE_RESET', userId)
            ),
          _error => new Error('Failed to create event notifications'),
          `Create date reset notifications for event: ${eventId}`
        )
      );

      return updatedEvent;
    }),
    'event',
    'updatePotentialDates',
    eventId
  );

// Modernized Effect-based function to delete event
export const deleteEventEffect = (eventId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Check if user is organizer (database operation with retry)
      const membership = yield* _(
        dbOperation(
          () =>
            db.membership.findFirst({
              where: {
                eventId,
                personId: userId,
                role: 'ORGANIZER',
              },
            }),
          _error => new EventNotFoundError(eventId),
          `Check organizer permissions for event ${eventId}`
        )
      );

      if (!membership) {
        return yield* _(
          Effect.fail(
            new EventUnauthorizedError('Only organizers can delete events')
          )
        );
      }

      // Delete the event (database operation with retry, cascade will handle related data)
      yield* _(
        dbOperation(
          () =>
            db.event.delete({
              where: { id: eventId },
            }),
          error => new EventDeletionError(error),
          `Delete event ${eventId}`
        )
      );

      return { message: 'Event deleted' };
    }),
    'event',
    'delete',
    eventId
  );

// Modernized Effect-based function to leave event
export const leaveEventEffect = (eventId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event with memberships (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: eventId },
              include: {
                memberships: true,
              },
            }),
          _error => new EventNotFoundError(eventId),
          `Fetch event for leave operation: ${eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventId)));
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new EventUserNotMemberError(eventId, userId))
        );
      }

      if (userMembership.role === 'ORGANIZER') {
        return yield* _(
          Effect.fail(
            new EventUnauthorizedError('Organizers cannot leave the event')
          )
        );
      }

      // Send leave notification before deleting membership using Effect version (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () =>
            Effect.runPromise(
              createEventNotifsEffect(eventId, 'USER_LEFT', userId)
            ),
          _error => new Error('Failed to create leave notifications'),
          `Create leave notifications for event: ${eventId}`
        )
      );

      // Delete the membership (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.membership.delete({
              where: {
                id: userMembership.id,
              },
            }),
          error => new EventUpdateError(error),
          `Delete membership for user ${userId} in event ${eventId}`
        )
      );

      // Send pusher notification (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          () => {
            const eventQueryDefinition = getEventQuery(eventId);
            return getPusherServer().trigger(
              eventQueryDefinition.pusherChannel,
              eventQueryDefinition.pusherEvent,
              { message: 'Data updated' }
            );
          },
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notification for leave event: ${eventId}`
        )
      );

      return { message: 'Left event' };
    }),
    'event',
    'leave',
    eventId
  );

// ============================================================================
// SAFE WRAPPERS WITH CUSTOM ERROR TYPES
// ============================================================================

export const fetchEventData = safeWrapper<
  [string, string],
  z.infer<typeof EventDataSchema>,
  EventNotFoundError | EventUserNotFoundError | EventUserNotMemberError
>(
  (eventId: string, userId: string) =>
    Effect.runPromise(fetchEventDataEffect(eventId, userId)),
  EventDataSchema
);

export const fetchEventPageData = safeWrapper<
  [string, string],
  z.infer<typeof EventDataWithPostsSchema>,
  EventNotFoundError | EventUserNotFoundError | EventUserNotMemberError
>(
  (eventId: string, userId: string) =>
    Effect.runPromise(fetchEventPageDataEffect(eventId, userId)),
  EventDataWithPostsSchema
);

export const createEvent = safeWrapper<
  [CreateEventInput, string],
  z.infer<typeof CreatedEventSchema>,
  EventCreationError
>(async (eventData: CreateEventInput, userId: string) => {
  const result = await Effect.runPromise(createEventEffect(eventData, userId));

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidatePersonQueries }) => {
      invalidatePersonQueries([userId], 'membership.updated', {
        eventId: result.id,
        eventTitle: eventData.title,
        userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, CreatedEventSchema);

export const updateEventDetails = safeWrapper<
  [UpdateEventDetailsInput, string],
  z.infer<typeof EventSchema>,
  | EventNotFoundError
  | EventUserNotMemberError
  | EventUnauthorizedError
  | EventUpdateError
>(async (eventData: UpdateEventDetailsInput, userId: string) => {
  const result = await Effect.runPromise(
    updateEventDetailsEffect(eventData, userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateEventQueries }) => {
      invalidateEventQueries(eventData.id, 'event.updated', {
        eventId: eventData.id,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        updatedBy: userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, EventSchema);

export const updateEventDateTime = safeWrapper<
  [string, string, string],
  z.infer<typeof EventSchema>,
  | EventNotFoundError
  | EventUserNotMemberError
  | EventUnauthorizedError
  | EventUpdateError
>(async (eventId: string, dateTime: string, userId: string) => {
  const result = await Effect.runPromise(
    updateEventDateTimeEffect(eventId, dateTime, userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateEventQueries }) => {
      invalidateEventQueries(eventId, 'event.date.changed', {
        eventId,
        newDateTime: dateTime,
        updatedBy: userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, EventSchema);

export const updateEventPotentialDateTimes = safeWrapper<
  [string, string[], string],
  z.infer<typeof EventSchema>,
  | EventNotFoundError
  | EventUserNotMemberError
  | EventUnauthorizedError
  | EventUpdateError
>(async (eventId: string, potentialDateTimes: string[], userId: string) => {
  const result = await Effect.runPromise(
    updateEventPotentialDateTimesEffect(eventId, potentialDateTimes, userId)
  );

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateEventQueries, invalidateAvailabilityQueries }) => {
      // Invalidate both event and availability data since potential dates changed
      invalidateEventQueries(eventId, 'event.date.changed', {
        eventId,
        potentialDateTimes,
        updatedBy: userId,
      });
      invalidateAvailabilityQueries(eventId, 'pdt.updated', {
        eventId,
        potentialDateTimes,
        updatedBy: userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, EventSchema);

export const deleteEvent = safeWrapper<
  [string, string],
  z.infer<typeof OperationSuccessSchema>,
  EventNotFoundError | EventUnauthorizedError | EventDeletionError
>(async (eventId: string, userId: string) => {
  const result = await Effect.runPromise(deleteEventEffect(eventId, userId));

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidateEventQueries, invalidatePersonQueries }) => {
      // Invalidate event queries for all members
      invalidateEventQueries(eventId, 'event.deleted', {
        eventId,
        deletedBy: userId,
      });
      // Also invalidate personal data for the organizer
      invalidatePersonQueries([userId], 'membership.updated', {
        eventId,
        action: 'deleted',
        userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, OperationSuccessSchema);

export const leaveEvent = safeWrapper<
  [string, string],
  z.infer<typeof OperationSuccessSchema>,
  EventNotFoundError | EventUserNotMemberError | EventUnauthorizedError
>(async (eventId: string, userId: string) => {
  const result = await Effect.runPromise(leaveEventEffect(eventId, userId));

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ handleMemberLeftEvent }) => {
      handleMemberLeftEvent(eventId, userId, {
        action: 'left',
        eventId,
        userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, OperationSuccessSchema);

import { Effect } from 'effect';
import { db } from './db';
import { auth } from '@clerk/nextjs/server';
import { createEventDetailsDTO, createEventMemberAvailabilityDTO, } from '@groupi/schema';
// Error types for event operations
export class EventNotFoundError extends Error {
    _tag = 'EventNotFoundError';
    constructor(eventId) {
        super(`Event not found: ${eventId}`);
    }
}
export class UserNotFoundError extends Error {
    _tag = 'UserNotFoundError';
    constructor() {
        super('User not found');
    }
}
export class UserNotMemberError extends Error {
    _tag = 'UserNotMemberError';
    constructor(eventId, userId) {
        super(`User ${userId} is not a member of event ${eventId}`);
    }
}
export class EventCreationError extends Error {
    _tag = 'EventCreationError';
    constructor(cause) {
        super('Failed to create event');
        if (cause) {
            this.cause = cause;
        }
    }
}
export class EventUpdateError extends Error {
    _tag = 'EventUpdateError';
    constructor(cause) {
        super('Failed to update event');
        if (cause) {
            this.cause = cause;
        }
    }
}
export class EventDeletionError extends Error {
    _tag = 'EventDeletionError';
    constructor(cause) {
        super('Failed to delete event');
        if (cause) {
            this.cause = cause;
        }
    }
}
// Effect-based service functions
export const fetchEventDataEffect = (eventId) => Effect.gen(function* (_) {
    // Log the operation
    yield* _(Effect.logInfo(`Fetching event data for event: ${eventId}`));
    // Get authenticated user
    const { userId } = yield* _(Effect.tryPromise({
        try: () => auth(),
        catch: () => new UserNotFoundError(),
    }));
    if (!userId) {
        return yield* _(Effect.fail(new UserNotFoundError()));
    }
    // Fetch event with all related data
    const event = yield* _(Effect.tryPromise({
        try: () => db.event.findUnique({
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
        catch: error => new EventNotFoundError(eventId),
    }));
    if (!event) {
        return yield* _(Effect.fail(new EventNotFoundError(eventId)));
    }
    // Check if user is a member
    const userMembership = event.memberships.find(membership => membership.personId === userId);
    if (!userMembership) {
        return yield* _(Effect.fail(new UserNotMemberError(eventId, userId)));
    }
    // Transform to DTOs
    const eventDTO = createEventDetailsDTO(event, userId);
    const userMembershipDTO = createEventMemberAvailabilityDTO(userMembership);
    // Log success
    yield* _(Effect.logInfo(`Successfully fetched event data for event: ${eventId}, user: ${userId}`));
    return {
        event: eventDTO,
        userMembership: userMembershipDTO,
        userId,
    };
});
export const createEventEffect = (eventData) => Effect.gen(function* (_) {
    // Log the operation
    yield* _(Effect.logInfo(`Creating event: ${eventData.title} with ${eventData.potentialDateTimes?.length || 0} potential dates`));
    // Get authenticated user
    const { userId } = yield* _(Effect.tryPromise({
        try: () => auth(),
        catch: () => new UserNotFoundError(),
    }));
    if (!userId) {
        return yield* _(Effect.fail(new UserNotFoundError()));
    }
    // Create the event
    const event = yield* _(Effect.tryPromise({
        try: () => db.event.create({
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
        catch: error => new EventCreationError(error),
    }));
    // Add potential date times if provided
    if (eventData.potentialDateTimes &&
        eventData.potentialDateTimes.length > 0) {
        const updatedEvent = yield* _(Effect.tryPromise({
            try: () => db.event.update({
                where: { id: event.id },
                data: {
                    potentialDateTimes: {
                        createMany: {
                            data: eventData.potentialDateTimes.map(dateTime => ({
                                dateTime,
                            })),
                        },
                    },
                },
                include: {
                    potentialDateTimes: true,
                },
            }),
            catch: error => new EventCreationError(error),
        }));
        // Create initial availabilities for the organizer
        if (updatedEvent.potentialDateTimes) {
            yield* _(Effect.tryPromise({
                try: () => db.availability.createMany({
                    data: updatedEvent.potentialDateTimes.map(pdt => ({
                        membershipId: event.memberships[0].id,
                        status: 'YES',
                        potentialDateTimeId: pdt.id,
                    })),
                }),
                catch: error => new EventCreationError(error),
            }));
        }
    }
    // Log success
    yield* _(Effect.logInfo(`Successfully created event: ${event.id} by user: ${userId}`));
    return event;
});
export const deleteEventEffect = (eventId) => Effect.gen(function* (_) {
    // Log the operation
    yield* _(Effect.logInfo(`Deleting event: ${eventId}`));
    // Get authenticated user
    const { userId } = yield* _(Effect.tryPromise({
        try: () => auth(),
        catch: () => new UserNotFoundError(),
    }));
    if (!userId) {
        return yield* _(Effect.fail(new UserNotFoundError()));
    }
    // Check if user is organizer
    const membership = yield* _(Effect.tryPromise({
        try: () => db.membership.findFirst({
            where: {
                eventId,
                personId: userId,
                role: 'ORGANIZER',
            },
        }),
        catch: error => new EventNotFoundError(eventId),
    }));
    if (!membership) {
        return yield* _(Effect.fail(new Error('Only organizers can delete events')));
    }
    // Delete the event (cascade will handle related data)
    yield* _(Effect.tryPromise({
        try: () => db.event.delete({
            where: { id: eventId },
        }),
        catch: error => new EventDeletionError(error),
    }));
    // Log success
    yield* _(Effect.logInfo(`Successfully deleted event: ${eventId} by user: ${userId}`));
    return { success: true };
});

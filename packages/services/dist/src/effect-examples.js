import { Effect, pipe } from 'effect';
import { fetchEventDataEffect, createEventEffect, deleteEventEffect, EventNotFoundError, UserNotFoundError, UserNotMemberError, EventCreationError, EventDeletionError, } from './event-effect';
// Example: Using Effect in server actions with proper error handling
export const fetchEventDataAction = async (eventId) => {
    const result = await Effect.runPromise(pipe(fetchEventDataEffect(eventId), Effect.map(data => ({ success: data })), Effect.catchAll(error => {
        // Handle different error types
        if (error instanceof EventNotFoundError) {
            return Effect.succeed({ error: 'Event not found' });
        }
        if (error instanceof UserNotFoundError) {
            return Effect.succeed({ error: 'User not authenticated' });
        }
        if (error instanceof UserNotMemberError) {
            return Effect.succeed({
                error: 'You are not a member of this event',
            });
        }
        // Log unexpected errors
        console.error('Unexpected error in fetchEventData:', error);
        return Effect.succeed({ error: 'An unexpected error occurred' });
    })));
    return result;
};
export const createEventAction = async (eventData) => {
    const result = await Effect.runPromise(pipe(createEventEffect(eventData), Effect.map(event => ({ success: event })), Effect.catchAll(error => {
        if (error instanceof UserNotFoundError) {
            return Effect.succeed({ error: 'User not authenticated' });
        }
        if (error instanceof EventCreationError) {
            console.error('Event creation failed:', error.cause);
            return Effect.succeed({ error: 'Failed to create event' });
        }
        console.error('Unexpected error in createEvent:', error);
        return Effect.succeed({ error: 'An unexpected error occurred' });
    })));
    return result;
};
export const deleteEventAction = async (eventId) => {
    const result = await Effect.runPromise(pipe(deleteEventEffect(eventId), Effect.map(result => ({ success: result })), Effect.catchAll(error => {
        if (error instanceof UserNotFoundError) {
            return Effect.succeed({ error: 'User not authenticated' });
        }
        if (error instanceof EventNotFoundError) {
            return Effect.succeed({ error: 'Event not found' });
        }
        if (error instanceof EventDeletionError) {
            console.error('Event deletion failed:', error.cause);
            return Effect.succeed({ error: 'Failed to delete event' });
        }
        if (error.message === 'Only organizers can delete events') {
            return Effect.succeed({ error: 'Only organizers can delete events' });
        }
        console.error('Unexpected error in deleteEvent:', error);
        return Effect.succeed({ error: 'An unexpected error occurred' });
    })));
    return result;
};
// Example: Composing multiple Effect operations
export const createEventWithNotificationsEffect = (eventData) => Effect.gen(function* (_) {
    // Create the event
    const event = yield* _(createEventEffect(eventData));
    // Log the creation
    yield* _(Effect.logInfo(`Event created successfully: ${event.id}`));
    // Here you could add notification logic
    // yield* _(sendEventCreationNotificationEffect(event));
    return event;
});
// Example: Parallel operations
export const fetchMultipleEventsEffect = (eventIds) => Effect.gen(function* (_) {
    // Fetch all events in parallel
    const events = yield* _(Effect.all(eventIds.map(id => fetchEventDataEffect(id)), { concurrency: 5 } // Limit concurrent requests
    ));
    return events;
});
// Example: Conditional operations
export const fetchEventDataConditionally = (eventId, userId) => Effect.gen(function* (_) {
    // First check if user has access to the event
    const hasAccess = yield* _(Effect.tryPromise({
        try: () => checkUserEventAccess(eventId, userId),
        catch: () => false,
    }));
    if (!hasAccess) {
        return yield* _(Effect.fail(new UserNotMemberError(eventId, userId)));
    }
    // If they have access, fetch the full event data
    return yield* _(fetchEventDataEffect(eventId));
});
// Helper function for the conditional example
async function checkUserEventAccess(eventId, userId) {
    // This would be a lightweight check to see if user has access
    // Implementation would depend on your access control logic
    return true; // Placeholder
}
// Example: Using Effect for logging and observability
export const createEventWithObservability = (eventData) => Effect.gen(function* (_) {
    // Start timing the operation
    const startTime = Date.now();
    yield* _(Effect.logInfo(`Starting event creation: ${eventData.title}`));
    // Create the event
    const event = yield* _(createEventEffect(eventData));
    // Log completion with timing
    const duration = Date.now() - startTime;
    yield* _(Effect.logInfo(`Event creation completed in ${duration}ms: ${event.id}`));
    return event;
});

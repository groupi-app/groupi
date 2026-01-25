'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

// ===== API REFERENCES =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventMutations: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueries: any;

function initApi() {
  if (!eventQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    eventQueries = api.events?.queries ?? {};
    eventMutations = api.events?.mutations ?? {};
    userQueries = api.users?.queries ?? {};
  }
}
initApi();

// ===== EVENT QUERIES =====

/**
 * Get event header data (title, description, location)
 */
export function useEventHeaderData(eventId: Id<'events'>) {
  return useQuery(eventQueries.getEventHeader, { eventId });
}

/**
 * Get event attendees page data (full member list with availability)
 */
export function useEventAttendeesData(eventId: Id<'events'>) {
  return useQuery(eventQueries.getEventAttendeesData, { eventId });
}

/**
 * Get event new post page data (minimal event info for post creation)
 * Uses getEventHeader which provides the needed data
 */
export function useEventNewPostPageData(eventId: Id<'events'>) {
  return useQuery(eventQueries.getEventHeader, { eventId });
}

/**
 * Get mutual events between current user and another user
 */
export function useMutualEvents(otherUserId: string) {
  return useQuery(userQueries.fetchMutualEventsByUserId, { otherUserId });
}

/**
 * Get current user's events (memberships)
 */
export function useUserEvents() {
  return useQuery(eventQueries.getUserEvents, {});
}

// ===== EVENT MUTATIONS =====

// Reminder offset type for events
type ReminderOffset =
  | '30_MINUTES'
  | '1_HOUR'
  | '2_HOURS'
  | '4_HOURS'
  | '1_DAY'
  | '2_DAYS'
  | '3_DAYS'
  | '1_WEEK'
  | '2_WEEKS'
  | '4_WEEKS';

/**
 * Create a new event with availability polling
 */
export function useCreateEvent() {
  const createEvent = useMutation(eventMutations.createEvent);
  const { toast } = useToast();

  return useCallback(
    async (data: {
      title: string;
      description?: string;
      location?: string;
      imageStorageId?: string; // Optional cover image storage ID
      potentialDateTimes?: string[]; // ISO date strings for multi-date events (legacy)
      potentialDateTimeOptions?: Array<{ start: string; end?: string }>; // New format with end times
      chosenDateTime?: string; // ISO date string for single-date events
      chosenEndDateTime?: string; // ISO date string for end time
      reminderOffset?: ReminderOffset; // When to remind attendees
    }) => {
      try {
        const result = await createEvent({
          title: data.title,
          description: data.description,
          location: data.location,
          imageStorageId: data.imageStorageId as Id<'_storage'> | undefined,
          potentialDateTimes: data.potentialDateTimes,
          potentialDateTimeOptions: data.potentialDateTimeOptions,
          chosenDateTime: data.chosenDateTime,
          chosenEndDateTime: data.chosenEndDateTime,
          reminderOffset: data.reminderOffset,
        });

        toast({
          title: 'Success',
          description: 'Event created successfully!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [createEvent, toast]
  );
}

/**
 * Update event details
 */
export function useUpdateEvent() {
  const updateEvent = useMutation(eventMutations.updateEvent);
  const { toast } = useToast();

  return useCallback(
    async (data: {
      eventId: Id<'events'>;
      title?: string;
      description?: string;
      location?: string;
      imageStorageId?: string | null; // Optional cover image storage ID (null to remove)
      reminderOffset?: ReminderOffset | null;
    }) => {
      try {
        const result = await updateEvent({
          eventId: data.eventId,
          title: data.title,
          description: data.description,
          location: data.location,
          imageStorageId:
            data.imageStorageId === null
              ? null
              : (data.imageStorageId as Id<'_storage'> | undefined),
          reminderOffset: data.reminderOffset,
        });

        toast({
          title: 'Success',
          description: 'Event updated successfully!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updateEvent, toast]
  );
}

/**
 * Delete an event (organizer only) with optimistic updates
 */
export function useDeleteEvent() {
  const baseMutation = useMutation(eventMutations.deleteEvent);
  const { toast } = useToast();

  // Create mutation with optimistic update
  const deleteEvent = useMemo(() => {
    return baseMutation.withOptimisticUpdate((localStore, args) => {
      // Get the current user events list
      const userEvents = localStore.getQuery(eventQueries.getUserEvents, {});

      if (userEvents && Array.isArray(userEvents)) {
        // Filter out the deleted event
        const filteredEvents = userEvents.filter(
          (item: { event: { _id: Id<'events'> } }) =>
            item.event._id !== args.eventId
        );

        localStore.setQuery(eventQueries.getUserEvents, {}, filteredEvents);
      }
    });
  }, [baseMutation]);

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await deleteEvent({ eventId });

        // No success toast here - the dialog handles it
        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [deleteEvent, toast]
  );
}

/**
 * Leave an event (non-organizers only)
 */
export function useLeaveEvent() {
  const leaveEvent = useMutation(eventMutations.leaveEvent);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await leaveEvent({ eventId });

        toast({
          title: 'Success',
          description: 'Left event successfully!',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to leave event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [leaveEvent, toast]
  );
}

/**
 * Update RSVP status for an event
 */
export function useUpdateRSVP() {
  return useMutation(eventMutations.updateRSVP);
}

/**
 * Reset event date (clear chosen date)
 */
export function useResetEventDate() {
  return useMutation(eventMutations.resetEventDate);
}

/**
 * Update potential date times for an event
 */
export function useUpdatePotentialDateTimes() {
  return useMutation(eventMutations.updatePotentialDateTimes);
}

// ===== COMBINED HOOKS =====

/**
 * Complete event management hook with all operations
 */
export function useEventManagement(eventId: Id<'events'>) {
  const eventHeader = useEventHeaderData(eventId);
  const eventAttendees = useEventAttendeesData(eventId);

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const leaveEvent = useLeaveEvent();

  const updateEventOptimistic = useCallback(
    async (data: {
      title?: string;
      description?: string;
      location?: string;
    }) => {
      return updateEvent({ eventId, ...data });
    },
    [eventId, updateEvent]
  );

  const deleteEventOptimistic = useCallback(async () => {
    return deleteEvent(eventId);
  }, [eventId, deleteEvent]);

  const leaveEventOptimistic = useCallback(async () => {
    return leaveEvent(eventId);
  }, [eventId, leaveEvent]);

  return {
    // Data
    event: eventHeader?.event,
    userMembership: eventHeader?.userMembership,
    attendees: eventAttendees,

    // Loading states
    isLoading: eventHeader === undefined,
    isAttendeesLoading: eventAttendees === undefined,

    // Actions
    updateEvent: updateEventOptimistic,
    deleteEvent: deleteEventOptimistic,
    leaveEvent: leaveEventOptimistic,
  };
}

// ===== HOOK ALIASES FOR COMPONENT COMPATIBILITY =====

/**
 * Alias for useEventHeaderData - for component compatibility
 */
export const useEventHeader = useEventHeaderData;

/**
 * Alias for useEventAttendeesData - returns member data for components expecting useEventMembers
 */
export const useEventMembers = useEventAttendeesData;

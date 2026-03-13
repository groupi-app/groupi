'use client';

/* eslint-disable react-hooks/refs -- This file uses intentional caching pattern for visibility optimization */

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useIsActive } from '@/providers/visibility-provider';

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
 * @param otherUserId - The other user's ID to find mutual events with
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true). Set to false to skip.
 */
export function useMutualEvents(
  otherUserId: string | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const shouldSkip = !enabled || !otherUserId;

  return useQuery(
    userQueries.fetchMutualEventsByUserId,
    shouldSkip ? 'skip' : { otherUserId }
  );
}

/**
 * Get current user's events (memberships)
 * Uses stale-while-revalidate caching to prevent skeleton flashing on tab switch.
 * Returns cached data while re-subscribing after tab becomes visible again.
 */
export function useUserEvents() {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(eventQueries.getUserEvents, isActive ? {} : 'skip');

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Get current user's events AND pending invites in a single query
 * Combines getUserEvents with pending invites for seamless tab switching.
 * Uses stale-while-revalidate caching.
 */
export function useUserEventsAndInvites() {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(
    eventQueries.getUserEventsAndInvites,
    isActive ? {} : 'skip'
  );

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
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

// Focal point type for image cropping
interface FocalPoint {
  x: number;
  y: number;
}

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
      imageFocalPoint?: FocalPoint; // Optional focal point for image cropping
      potentialDateTimes?: string[]; // ISO date strings for multi-date events (legacy)
      potentialDateTimeOptions?: Array<{ start: string; end?: string }>; // New format with end times
      chosenDateTime?: string; // ISO date string for single-date events
      chosenEndDateTime?: string; // ISO date string for end time
      reminderOffset?: ReminderOffset; // Legacy: kept for backward compat
      addons?: Array<{ addonType: string; config: Record<string, unknown> }>; // Add-on configs
      visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
    }) => {
      try {
        const result = await createEvent({
          title: data.title,
          description: data.description,
          location: data.location,
          imageStorageId: data.imageStorageId as Id<'_storage'> | undefined,
          imageFocalPoint: data.imageFocalPoint,
          potentialDateTimes: data.potentialDateTimes,
          potentialDateTimeOptions: data.potentialDateTimeOptions,
          chosenDateTime: data.chosenDateTime,
          chosenEndDateTime: data.chosenEndDateTime,
          reminderOffset: data.reminderOffset,
          addons: data.addons,
          visibility: data.visibility,
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
      imageFocalPoint?: FocalPoint | null; // Optional focal point (null to clear)
      visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC' | null;
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
          imageFocalPoint: data.imageFocalPoint,
          visibility: data.visibility,
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

// ===== DISCOVER HOOKS =====

/**
 * Get discoverable events from friends (FRIENDS visibility)
 * Uses stale-while-revalidate caching.
 */
export function useDiscoverableEvents() {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(
    eventQueries.getDiscoverableEvents,
    isActive ? {} : 'skip'
  );

  if (result !== undefined) {
    cachedRef.current = result;
  }

  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Join a discoverable event (friends-visible)
 */
export function useJoinDiscoverableEvent() {
  const joinEvent = useMutation(eventMutations.joinDiscoverableEvent);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await joinEvent({ eventId });

        toast({
          title: 'Joined event',
          description: "You've joined the event successfully!",
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to join event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [joinEvent, toast]
  );
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

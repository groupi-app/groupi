/**
 * Platform-agnostic event action hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 * UI feedback (toasts, alerts) handled separately per platform
 */

import { useMutation } from 'convex/react';
import { useCallback } from 'react';
import type { ConvexApi, ConvexId, Status } from './types';

/**
 * Event action hooks factory - accepts api and returns event action hooks
 */
export function createEventActionHooks(api: ConvexApi) {
  /**
   * Create a new event
   * Works on web and mobile - no UI feedback included
   */
  function useCreateEvent() {
    return useMutation(api.events.mutations.createEvent);
  }

  /**
   * Update event details
   * Works on web and mobile - no UI feedback included
   */
  function useUpdateEvent() {
    return useMutation(api.events.mutations.updateEvent);
  }

  /**
   * Delete an event (organizer only)
   * Works on web and mobile - no UI feedback included
   */
  function useDeleteEvent() {
    return useMutation(api.events.mutations.deleteEvent);
  }

  /**
   * Leave an event (non-organizers only)
   * Works on web and mobile - no UI feedback included
   */
  function useLeaveEvent() {
    return useMutation(api.events.mutations.leaveEvent);
  }

  /**
   * Join an event (accept invite or join public event)
   * Works on web and mobile - no UI feedback included
   */
  function useJoinEvent() {
    return useMutation(api.events.mutations.joinEvent);
  }

  /**
   * Update RSVP status for an event
   * Works on web and mobile
   */
  function useUpdateRSVP() {
    return useMutation(api.events.mutations.updateRSVP);
  }

  /**
   * Reset event date (clear chosen date)
   * Works on web and mobile
   */
  function useResetEventDate() {
    return useMutation(api.events.mutations.resetEventDate);
  }

  /**
   * Update potential date times for an event
   * Works on web and mobile
   */
  function useUpdatePotentialDateTimes() {
    return useMutation(api.events.mutations.updatePotentialDateTimes);
  }

  /**
   * Event actions bound to specific event ID
   * Works on web and mobile - UI feedback handled separately
   */
  function useEventActions(eventId: ConvexId<'events'>) {
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();
    const leaveEvent = useLeaveEvent();
    const updateRSVP = useUpdateRSVP();
    const resetEventDate = useResetEventDate();
    const updatePotentialDateTimes = useUpdatePotentialDateTimes();

    // Bound actions with eventId pre-filled
    const updateEventForId = useCallback(
      async (data: {
        title?: string;
        description?: string;
        location?: string;
      }) => {
        return updateEvent({ eventId, ...data });
      },
      [eventId, updateEvent]
    );

    const deleteEventForId = useCallback(async () => {
      return deleteEvent({ eventId });
    }, [eventId, deleteEvent]);

    const leaveEventForId = useCallback(async () => {
      return leaveEvent({ eventId });
    }, [eventId, leaveEvent]);

    const updateRSVPForId = useCallback(
      async (rsvpStatus: Status) => {
        return updateRSVP({ eventId, rsvpStatus });
      },
      [eventId, updateRSVP]
    );

    const resetDateForId = useCallback(async () => {
      return resetEventDate({ eventId });
    }, [eventId, resetEventDate]);

    const updateDateOptionsForId = useCallback(
      async (potentialDateTimes: string[]) => {
        return updatePotentialDateTimes({ eventId, potentialDateTimes });
      },
      [eventId, updatePotentialDateTimes]
    );

    return {
      updateEvent: updateEventForId,
      deleteEvent: deleteEventForId,
      leaveEvent: leaveEventForId,
      updateRSVP: updateRSVPForId,
      resetEventDate: resetDateForId,
      updatePotentialDateTimes: updateDateOptionsForId,
    };
  }

  /**
   * Complete event management for a specific event
   * Combines data and actions - works on web and mobile
   */
  function useEventManagement(eventId: ConvexId<'events'>) {
    const actions = useEventActions(eventId);

    return {
      // Actions (no UI feedback - handle in platform layer)
      ...actions,
    };
  }

  return {
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    useLeaveEvent,
    useJoinEvent,
    useUpdateRSVP,
    useResetEventDate,
    useUpdatePotentialDateTimes,
    useEventActions,
    useEventManagement,
  };
}

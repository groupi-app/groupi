/**
 * Platform-agnostic event data hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 */

import { useQuery } from 'convex/react';
import type { ConvexApi, ConvexId } from './types';

/**
 * Event data hooks factory - accepts api and returns event data hooks
 */
export function createEventDataHooks(api: ConvexApi) {
  /**
   * Get event header data (title, description, basic info)
   * Works on web and mobile
   */
  function useEventHeader(eventId: ConvexId<'events'>) {
    return useQuery(api.events.queries.getEventHeader, { eventId });
  }

  /**
   * Get event members/attendees data
   * Works on web and mobile
   */
  function useEventMembers(eventId: ConvexId<'events'>) {
    return useQuery(api.events.queries.getEventAttendeesData, { eventId });
  }

  /**
   * Get current user's events
   * Works on web and mobile
   */
  function useUserEvents() {
    return useQuery(api.events.queries.getUserEvents, {});
  }

  /**
   * Get mutual events between users
   * Works on web and mobile
   */
  function useMutualEvents(userId: ConvexId<'users'>) {
    return useQuery(api.events.queries.getMutualEvents, { userId });
  }

  /**
   * Get event availability/voting data
   * Works on web and mobile
   */
  function useEventAvailability(eventId: ConvexId<'events'>) {
    return useQuery(api.events.queries.getEventAvailabilityData, { eventId });
  }

  /**
   * Check if user can manage a specific event
   * Works on web and mobile
   */
  function useCanManageEvent(eventId: ConvexId<'events'>) {
    const eventData = useEventHeader(eventId);
    const userMembership = eventData?.userMembership;

    return {
      canManage:
        userMembership?.role === 'ORGANIZER' ||
        userMembership?.role === 'MODERATOR',
      canDelete: userMembership?.role === 'ORGANIZER',
      canEdit:
        userMembership?.role === 'ORGANIZER' ||
        userMembership?.role === 'MODERATOR',
      role: userMembership?.role,
    };
  }

  /**
   * Get loading states for event-related operations
   * Works on web and mobile
   */
  function useEventLoadingStates(eventId: ConvexId<'events'>) {
    const eventHeader = useEventHeader(eventId);
    const eventMembers = useEventMembers(eventId);
    const eventAvailability = useEventAvailability(eventId);

    return {
      isLoadingHeader: eventHeader === undefined,
      isLoadingMembers: eventMembers === undefined,
      isLoadingAvailability: eventAvailability === undefined,
      isLoadingAny: eventHeader === undefined || eventMembers === undefined,
      hasHeaderData: eventHeader !== undefined,
      hasMembersData: eventMembers !== undefined,
      hasAvailabilityData: eventAvailability !== undefined,
    };
  }

  return {
    useEventHeader,
    useEventMembers,
    useUserEvents,
    useMutualEvents,
    useEventAvailability,
    useCanManageEvent,
    useEventLoadingStates,
  };
}

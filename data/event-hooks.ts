import { EventData, fetchEventData } from '@/lib/actions/event';
import { getEventQuery } from '@/lib/query-definitions';
import { ActionResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useEventDataQuery(
  eventId: string,
  select: (data: ActionResponse<EventData>) => any
) {
  const queryDefinition = getEventQuery(eventId);
  return useQuery({
    queryFn: async () => fetchEventData(eventId),
    queryKey: [queryDefinition.queryKey],
    select,
  });
}

export function useEventPosts(eventId: string) {
  return useEventDataQuery(eventId, (data: ActionResponse<EventData>) => {
    if (data.error) {
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return {
        posts: data.success.event.posts,
        userRole: data.success.userMembership.role,
        userId: data.success.userId,
        members: data.success.event.memberships,
        eventDateTime: data.success.event.chosenDateTime,
      };
    }
  });
}

export function useEventMembers(eventId: string) {
  return useEventDataQuery(eventId, (data: ActionResponse<EventData>) => {
    if (data.error) {
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return {
        members: data.success.event.memberships,
        userRole: data.success.userMembership.role,
        userId: data.success.userId,
        eventDateTime: data.success.event.chosenDateTime,
      };
    }
  });
}

export function useEventHeader(eventId: string) {
  return useEventDataQuery(eventId, (data: ActionResponse<EventData>) => {
    if (data.error) {
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return {
        ...data.success.event,
        userMembership: data.success.userMembership,
      };
    }
  });
}

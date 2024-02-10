import { EventData, fetchEventData } from "@/lib/actions/event-data";
import { useQuery } from "@tanstack/react-query";
import { ActionResponse } from "@/types";
import { getEventQuery } from "@/lib/query-definitions";

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
      throw new Error(data.error);
    }
    if (data.success) {
      return {
        posts: data.success.event.posts,
        userRole: data.success.userRole,
        userId: data.success.userId,
      };
    }
  });
}

export function useEventMembers(eventId: string) {
  return useEventDataQuery(eventId, (data: ActionResponse<EventData>) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      return {
        members: data.success.event.memberships,
        userRole: data.success.userRole,
        userId: data.success.userId,
      };
    }
  });
}

export function useEventHeader(eventId: string) {
  return useEventDataQuery(eventId, (data: ActionResponse<EventData>) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      return { ...data.success.event };
    }
  });
}

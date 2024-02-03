import { EventData, fetchEventData } from "@/lib/actions/event-data";
import { useQuery } from "@tanstack/react-query";

export function useEventDataQuery(eventId: string, select: (data: EventData) => any) {
  return useQuery({
    queryFn: async () => fetchEventData(eventId),
    queryKey: ["eventData"],
    select
  });
}

export function useEventPosts(eventId: string) {
  return useEventDataQuery(eventId, (data:EventData) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      return {posts: data.success.posts, isMod: data.success.isMod, userId: data.success.userId}
    }
  });
}

export function useEventMembers(eventId: string) {
  return useEventDataQuery(eventId, (data:EventData) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      return {members: data.success.members}
    }
  });
}

export function useEventHeader(eventId: string) {
  return useEventDataQuery(eventId, (data:EventData) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      return {...data.success.headerData}
    }
  });
}
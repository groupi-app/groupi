import { useQuery } from "@tanstack/react-query";
import { ActionResponse, EventInviteData } from "@/types";
import { getInviteQuery } from "@/lib/query-definitions";
import { getEventInviteData } from "@/lib/actions/invite";

export function useInviteDataQuery(
  eventId: string,
  select: (data: ActionResponse<EventInviteData>) => any
) {
  const queryDefinition = getInviteQuery(eventId);
  return useQuery({
    queryFn: async () => getEventInviteData(eventId),
    queryKey: [queryDefinition.queryKey],
    select,
  });
}

export function useInvites(eventId: string) {
  return useInviteDataQuery(
    eventId,
    (data: ActionResponse<EventInviteData>) => {
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.success) {
        return {
          invites: data.success.invites,
        };
      }
    }
  );
}

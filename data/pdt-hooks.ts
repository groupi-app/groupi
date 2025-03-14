import {
  getEventPotentialDateTimes,
  PDTData,
} from "@/lib/actions/availability";
import { getPDTQuery } from "@/lib/query-definitions";
import { ActionResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function usePDTDataQuery(
  eventId: string,
  select: (data: ActionResponse<PDTData>) => any
) {
  const queryDefinition = getPDTQuery(eventId);
  return useQuery({
    queryFn: async () => getEventPotentialDateTimes(eventId),
    queryKey: [queryDefinition.queryKey],
    select,
  });
}

export function usePDTs(eventId: string) {
  return usePDTDataQuery(eventId, (data: ActionResponse<PDTData>) => {
    if (data.error) {
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return {
        potentialDateTimes: data.success.potentialDateTimes,
        userRole: data.success.userRole,
        userId: data.success.userId,
      };
    }
  });
}

import { getEventPotentialDateTimes } from '@groupi/services';
import { getPDTQuery } from '@groupi/schema/queries';
import { useQuery } from '@tanstack/react-query';
export function usePDTDataQuery(eventId, select) {
    const queryDefinition = getPDTQuery(eventId);
    return useQuery({
        queryFn: async () => getEventPotentialDateTimes(eventId),
        queryKey: [queryDefinition.queryKey],
        select,
    });
}
export function usePDTs(eventId) {
    return usePDTDataQuery(eventId, (data) => {
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

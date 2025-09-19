import { getEventInviteData } from '@groupi/services';
import { getInviteQuery } from '@groupi/schema/queries';
import { useQuery } from '@tanstack/react-query';
export function useInviteDataQuery(eventId, select) {
    const queryDefinition = getInviteQuery(eventId);
    return useQuery({
        queryFn: async () => getEventInviteData(eventId),
        queryKey: [queryDefinition.queryKey],
        select,
    });
}
export function useInvites(eventId) {
    return useInviteDataQuery(eventId, (data) => {
        if (data.error) {
            return {
                error: data.error,
            };
        }
        if (data.success) {
            return {
                invites: data.success.invites,
            };
        }
    });
}

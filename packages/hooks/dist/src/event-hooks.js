import { fetchEventPageData, } from '@groupi/services';
import { getEventQuery } from '@groupi/schema/queries';
import { useQuery } from '@tanstack/react-query';


export function useEventPageData(eventId) {
    const queryDefinition = getEventQuery(eventId);
    return useQuery({
        queryFn: async () => fetchEventPageData(eventId),
        queryKey: [queryDefinition.queryKey],
    });
}

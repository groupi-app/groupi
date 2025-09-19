import { fetchPersonData } from '@groupi/services';
import { getPersonQuery } from '@groupi/schema/queries';
import { useQuery } from '@tanstack/react-query';
export function usePersonDataQuery(userId, select) {
    const queryDefinition = getPersonQuery(userId);
    return useQuery({
        queryFn: async () => fetchPersonData(userId),
        queryKey: [queryDefinition.queryKey],
        select,
    });
}
export function usePersonMemberships(userId) {
    return usePersonDataQuery(userId, (data) => {
        if (data.error) {
            return {
                error: data.error,
            };
        }
        if (data.success) {
            return {
                memberships: data.success.memberships,
            };
        }
    });
}

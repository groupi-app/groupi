import { fetchNotificationsForPerson } from '@groupi/services';
import { getNotificationQuery } from '@groupi/schema/queries';
import { useQuery } from '@tanstack/react-query';
export function useNotificationsDataQuery(userId, select) {
    const queryDefinition = getNotificationQuery(userId);
    return useQuery({
        queryFn: async () => fetchNotificationsForPerson(userId),
        queryKey: [queryDefinition.queryKey],
        select,
    });
}
export function useNotifications(userId) {
    return useNotificationsDataQuery(userId, (data) => {
        if (data.error) {
            return {
                error: data.error,
            };
        }
        if (data.success) {
            return {
                notifications: data.success,
            };
        }
    });
}

import { fetchNotificationsForPerson } from '@/lib/actions/notification';
import { getNotificationQuery } from '@/lib/query-definitions';
import { ActionResponse, NotificationWithPersonEventPost } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useNotificationsDataQuery(
  userId: string,
  select: (data: ActionResponse<NotificationWithPersonEventPost[]>) => any
) {
  const queryDefinition = getNotificationQuery(userId);
  return useQuery({
    queryFn: async () => fetchNotificationsForPerson(userId),
    queryKey: [queryDefinition.queryKey],
    select,
  });
}

export function useNotifications(userId: string) {
  return useNotificationsDataQuery(
    userId,
    (data: ActionResponse<NotificationWithPersonEventPost[]>) => {
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
    }
  );
}

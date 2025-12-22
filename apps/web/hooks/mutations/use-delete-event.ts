'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEventAction } from '@/actions/event-actions';
import { qk } from '@/lib/query-keys';
import type { DeleteEventParams } from '@groupi/schema/params';
import type { UserDashboardData } from '@groupi/schema/data';
import type { EventMutationError } from '@/actions/event-actions';

/**
 * Mutation hook for deleting an event
 * Note: Cache invalidation is handled server-side by deleteEventAction
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: DeleteEventParams
    ): Promise<{ message: string }> => {
      const [error, data] = await deleteEventAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (deletedEvent: DeleteEventParams) => {
      // Find user's event list query by searching cache
      const queryCache = queryClient.getQueryCache();
      const userEventQueries = queryCache.findAll({
        predicate: (query: { queryKey: readonly unknown[] }) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === 'events' &&
            key[1] === 'list' &&
            key.length === 3
          );
        },
      });

      // Save previous data for rollback
      const prevData = userEventQueries.map(
        (query: { queryKey: readonly unknown[]; state: { data: unknown } }) => ({
          queryKey: [...query.queryKey],
          data: query.state.data,
        })
      );

      // Optimistically remove event from all user event lists
      userEventQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        const userId = query.queryKey[2] as string | undefined;
        if (!userId) return;

        queryClient.setQueryData<UserDashboardData>(
          qk.events.listByUser(userId),
          (old: UserDashboardData | undefined) => {
            if (!old) return old;

            return {
              ...old,
              memberships: old.memberships.filter(
                m => m.event.id !== deletedEvent.eventId
              ),
            };
          }
        );
      });

      return { prevData };
    },
    onError: (
      _err: EventMutationError,
      _deletedEvent: DeleteEventParams,
      ctx?: { prevData?: Array<{ queryKey: unknown[]; data: unknown }> }
    ) => {
      // Rollback on error
      if (ctx?.prevData) {
        ctx.prevData.forEach(
          ({ queryKey, data }: { queryKey: readonly unknown[]; data: unknown }) => {
            queryClient.setQueryData(queryKey, data);
          }
        );
      }
    },
    onSuccess: (_data, variables) => {
      // Remove event from cache
      queryClient.removeQueries({
        queryKey: qk.events.header(variables.eventId),
      });
      // Server action already handles user events cache invalidation
      // Just invalidate all event queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['events'],
        refetchType: 'none',
      });
    },
  });
}

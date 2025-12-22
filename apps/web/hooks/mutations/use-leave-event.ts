'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveEventAction } from '@/actions/event-actions';
import { qk } from '@/lib/query-keys';
import type { LeaveEventParams } from '@groupi/schema/params';
import type {
  UserDashboardData,
  MemberListPageData,
} from '@groupi/schema/data';
import type { EventMutationError } from '@/actions/event-actions';

/**
 * Mutation hook for leaving an event
 * Note: Cache invalidation is handled server-side by leaveEventAction
 */
export function useLeaveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: LeaveEventParams
    ): Promise<{ message: string; membershipId: string }> => {
      const [error, data] = await leaveEventAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (leftEvent: LeaveEventParams) => {
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

      // Find member list query for this event
      const memberListQuery = queryCache.find({
        queryKey: qk.memberships.list(leftEvent.eventId),
      });

      // Save previous data for rollback
      const prevData = [
        ...userEventQueries.map(
          (query: { queryKey: readonly unknown[]; state: { data: unknown } }) => ({
            queryKey: [...query.queryKey],
            data: query.state.data,
          })
        ),
        ...(memberListQuery
          ? [
              {
                queryKey: [...memberListQuery.queryKey],
                data: memberListQuery.state.data,
              },
            ]
          : []),
      ];

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
                m => m.event.id !== leftEvent.eventId
              ),
            };
          }
        );
      });

      // Optimistically remove current user from member list
      if (memberListQuery) {
        queryClient.setQueryData<MemberListPageData>(
          qk.memberships.list(leftEvent.eventId),
          (old: MemberListPageData | undefined) => {
            if (!old) return old;

            // Get current user's membership ID from the query data
            const currentUserMembershipId = old.userMembership?.id;
            if (!currentUserMembershipId) return old;

            return {
              ...old,
              event: {
                ...old.event,
                memberships: old.event.memberships.filter(
                  m => m.id !== currentUserMembershipId
                ),
              },
            };
          }
        );
      }

      return { prevData };
    },
    onError: (
      _err: EventMutationError,
      _leftEvent: LeaveEventParams,
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
      // Remove event header from cache
      queryClient.removeQueries({
        queryKey: qk.events.header(variables.eventId),
      });
      
      // Refetch active queries immediately (for current user's own leave action)
      // Invalidate inactive queries (they'll refetch on mount)
      queryClient.invalidateQueries({
        queryKey: qk.memberships.list(variables.eventId),
        refetchType: 'active', // Refetch if query is currently active/mounted
      });
      queryClient.invalidateQueries({
        queryKey: qk.availability.data(variables.eventId),
        refetchType: 'active', // Refetch if query is currently active/mounted
      });
      
      // Server action already handles user events cache invalidation
      // Just invalidate all event queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['events'],
        refetchType: 'active', // Refetch active queries for user's event list
      });
    },
  });
}

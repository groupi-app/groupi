'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEventAction } from '@/actions/event-actions';
import { qk } from '@/lib/query-keys';
import type { EventHeaderData, UserDashboardData } from '@groupi/schema/data';
import type { CreateEventParams } from '@groupi/schema/params';
import type { EventMutationError } from '@/actions/event-actions';

/**
 * Helper to convert date strings to Date objects in EventHeaderData
 */
function convertEventHeaderDates(
  data: EventHeaderData & { event: { chosenDateTime?: Date | string | null } }
): EventHeaderData {
  return {
    ...data,
    event: {
      ...data.event,
      chosenDateTime: data.event.chosenDateTime
        ? data.event.chosenDateTime instanceof Date
          ? data.event.chosenDateTime
          : new Date(data.event.chosenDateTime)
        : null,
    },
  };
}

/**
 * Mutation hook for creating an event with optimistic updates
 * Note: Cache invalidation is handled server-side by createEventAction
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (input: CreateEventParams): Promise<EventHeaderData> => {
      const [error, data] = await createEventAction(input);
      if (error) throw error;
      // Convert date strings back to Date objects (server actions serialize dates as strings)
      return convertEventHeaderDates(data);
    },
    onMutate: async (newEvent: CreateEventParams) => {
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

      // Optimistically add event to all user event lists
      userEventQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        const userId = query.queryKey[2] as string | undefined;
        if (!userId) return;

        queryClient.setQueryData<UserDashboardData>(
          qk.events.listByUser(userId),
          (old: UserDashboardData | undefined) => {
            if (!old) return old;

            // Create optimistic membership with ORGANIZER role
            const optimisticMembership = {
              id: 'optimistic-' + Date.now(),
              role: 'ORGANIZER' as const,
              rsvpStatus: 'YES' as const,
              event: {
                id: 'optimistic-' + Date.now(),
                title: newEvent.title,
                description: newEvent.description || '',
                location: newEvent.location || '',
                chosenDateTime: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            };

            return {
              ...old,
              memberships: [optimisticMembership, ...old.memberships],
            };
          }
        );
      });

      return { prevData };
    },
    onError: (
      _err: EventMutationError,
      _newEvent: CreateEventParams,
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
    onSuccess: (data: EventHeaderData) => {
      // Find user's event list query and replace optimistic with real data
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

      userEventQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        const userId = query.queryKey[2] as string | undefined;
        if (!userId) return;

        queryClient.setQueryData<UserDashboardData>(
          qk.events.listByUser(userId),
          (old: UserDashboardData | undefined) => {
            if (!old) return old;

            // Remove optimistic membership
            const withoutOptimistic = old.memberships.filter(
              m => !m.id.startsWith('optimistic-')
            );

            // Create real membership from EventHeaderData
            // Note: We need to construct membership from event data
            // The server returns EventHeaderData which includes userMembership
            const realMembership = {
              id: data.userMembership.id,
              role: data.userMembership.role,
              rsvpStatus: data.userMembership.rsvpStatus,
              event: {
                id: data.event.id,
                title: data.event.title,
                description: data.event.description,
                location: data.event.location,
                chosenDateTime: data.event.chosenDateTime,
                createdAt: new Date(), // Will be updated by server
                updatedAt: new Date(), // Will be updated by server
              },
            };

            return {
              ...old,
              memberships: [realMembership, ...withoutOptimistic],
            };
          }
        );
      });

      // Silently invalidate for background sync (no refetch)
      queryClient.invalidateQueries({
        queryKey: ['events'],
        refetchType: 'none',
      });
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeMemberAction } from '@/actions/membership-actions';
import { qk } from '@/lib/query-keys';
import type { MemberListPageData } from '@groupi/schema/data';
import type { MembershipMutationError } from '@/actions/membership-actions';

interface RemoveMemberInput {
  memberId: string;
}

/**
 * Mutation hook for removing a member from an event
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: RemoveMemberInput
    ): Promise<{ message: string; eventId?: string }> => {
      const [error, data] = await removeMemberAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (removedMember: RemoveMemberInput) => {
      // Find all member list queries
      const queryCache = queryClient.getQueryCache();
      const memberListQueries = queryCache.findAll({
        predicate: (query: { queryKey: readonly unknown[] }) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === 'memberships' &&
            key[1] === 'list' &&
            key.length === 3
          );
        },
      });

      // Save previous data for rollback
      const prevData = memberListQueries.map(
        (query: {
          queryKey: readonly unknown[];
          state: { data: unknown };
        }) => ({
          queryKey: [...query.queryKey],
          data: query.state.data,
        })
      );

      // Optimistically remove member from all member lists
      memberListQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        const eventId = query.queryKey[2] as string | undefined;
        if (!eventId) return;

        queryClient.setQueryData<MemberListPageData>(
          qk.memberships.list(eventId),
          (old: MemberListPageData | undefined) => {
            if (!old) return old;

            return {
              ...old,
              event: {
                ...old.event,
                memberships: old.event.memberships.filter(
                  m => m.id !== removedMember.memberId
                ),
              },
            };
          }
        );
      });

      return { prevData };
    },
    onError: (
      _err: MembershipMutationError,
      _removedMember: RemoveMemberInput,
      ctx?: { prevData?: Array<{ queryKey: unknown[]; data: unknown }> }
    ) => {
      // Rollback on error
      if (ctx?.prevData) {
        ctx.prevData.forEach(
          ({
            queryKey,
            data,
          }: {
            queryKey: readonly unknown[];
            data: unknown;
          }) => {
            queryClient.setQueryData(queryKey, data);
          }
        );
      }
    },
    onSuccess: data => {
      if (data.eventId) {
        // Silently invalidate for background sync (no refetch)
        queryClient.invalidateQueries({
          queryKey: qk.memberships.list(data.eventId),
          refetchType: 'none',
        });
      }
    },
  });
}

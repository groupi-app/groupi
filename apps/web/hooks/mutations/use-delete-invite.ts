'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInviteAction } from '@/actions/invite-actions';
import type { EventInvitePageData } from '@groupi/schema/data';
import type { InviteMutationError } from '@/actions/invite-actions';
import { qk } from '@/lib/query-keys';

interface DeleteInviteInput {
  inviteId: string;
}

/**
 * Mutation hook for deleting an invite
 * Uses React Query for optimistic updates and Pusher for real-time sync
 */
export function useDeleteInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: DeleteInviteInput
    ): Promise<{ message: string; eventId: string }> => {
      const [error, data] = await deleteInviteAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (deletedInvite: DeleteInviteInput) => {
      // Find the invite in cache to get eventId
      const queryCache = queryClient.getQueryCache();
      const inviteQueries = queryCache.findAll({
        predicate: (query: { queryKey: readonly unknown[] }) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === 'invites' &&
            key[1] === 'management' &&
            key.length === 3
          );
        },
      });

      // Find which query contains this invite and get eventId
      let eventId: string | undefined;
      const prevData: Array<{ queryKey: unknown[]; data: unknown }> = [];

      for (const query of inviteQueries) {
        const data = query.state.data as EventInvitePageData | undefined;
        if (data) {
          const invite = data.invites.find(
            i => i.id === deletedInvite.inviteId
          );
          if (invite) {
            eventId = invite.eventId;
            prevData.push({
              queryKey: [...query.queryKey],
              data: query.state.data,
            });

            // Optimistically remove invite from this query
            queryClient.setQueryData<EventInvitePageData>(
              query.queryKey,
              (old: EventInvitePageData | undefined) => {
                if (!old) return old;

                return {
                  ...old,
                  invites: old.invites.filter(
                    i => i.id !== deletedInvite.inviteId
                  ),
                };
              }
            );
            break; // Found the invite, no need to check other queries
          }
        }
      }

      // Also save data for any other queries (for rollback)
      inviteQueries.forEach(query => {
        if (
          !prevData.some(
            p => JSON.stringify(p.queryKey) === JSON.stringify(query.queryKey)
          )
        ) {
          prevData.push({
            queryKey: [...query.queryKey],
            data: query.state.data,
          });
        }
      });

      return { prevData, eventId };
    },
    onError: (
      _err: InviteMutationError,
      _deletedInvite: DeleteInviteInput,
      ctx?: {
        prevData?: Array<{ queryKey: unknown[]; data: unknown }>;
        eventId?: string;
      }
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
    onSuccess: (data, _variables, context) => {
      // Silently invalidate for background sync (no refetch)
      // Pusher will handle real-time updates
      const eventId = data.eventId || context?.eventId;
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: qk.invites.management(eventId),
          refetchType: 'none',
        });
      }
    },
  });
}

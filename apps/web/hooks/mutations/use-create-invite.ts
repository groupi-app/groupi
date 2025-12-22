'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInviteAction } from '@/actions/invite-actions';
import type {
  EventInviteData,
  EventInvitePageData,
} from '@groupi/schema/data';
import type { CreateInviteParams } from '@groupi/schema/params';
import type { InviteMutationError } from '@/actions/invite-actions';
import { qk } from '@/lib/query-keys';

/**
 * Mutation hook for creating an invite
 * Note: Invites don't currently use React Query, so optimistic updates
 * will only work once React Query is set up for invites.
 * Pusher events are triggered server-side for real-time updates.
 */
export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (input: CreateInviteParams): Promise<EventInviteData> => {
      const [error, data] = await createInviteAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (newInvite: CreateInviteParams) => {
      // Find invite management query if it exists
      const queryCache = queryClient.getQueryCache();
      const inviteQuery = queryCache.find({
        queryKey: qk.invites.management(newInvite.eventId),
      });

      // Save previous data for rollback
      const prevData = inviteQuery
        ? [
            {
              queryKey: [...inviteQuery.queryKey],
              data: inviteQuery.state.data,
            },
          ]
        : [];

      // Optimistically add invite if query exists
      if (inviteQuery) {
        queryClient.setQueryData<EventInvitePageData>(
          qk.invites.management(newInvite.eventId),
          (old: EventInvitePageData | undefined) => {
            if (!old) return old;

            // Create optimistic invite
            const optimisticInvite: EventInviteData = {
              id: 'optimistic-' + Date.now(),
              name: newInvite.name || 'New Invite',
              eventId: newInvite.eventId,
              createdById: 'optimistic', // Will be replaced by real data
              expiresAt: newInvite.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              usesRemaining: newInvite.maxUses || null,
              maxUses: newInvite.maxUses || null,
              createdAt: new Date(),
              createdBy: {
                id: 'optimistic',
                person: {
                  id: 'optimistic',
                  user: {
                    name: null,
                    email: '',
                    image: null,
                  },
                },
              },
            };

            return {
              ...old,
              invites: [optimisticInvite, ...old.invites],
            };
          }
        );
      }

      return { prevData };
    },
    onError: (
      _err: InviteMutationError,
      _newInvite: CreateInviteParams,
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
    onSuccess: (_data: EventInviteData, _variables) => {
      // Don't replace optimistic invite here - let Pusher handle it
      // This prevents glitching because Pusher will replace the optimistic
      // invite in place (same position), rather than removing and adding a new one
      // The optimistic invite will be seamlessly replaced when Pusher event arrives
      
      // Silently invalidate for background sync (no refetch)
      // Pusher will handle real-time updates
      queryClient.invalidateQueries({
        queryKey: qk.invites.management(_variables.eventId),
        refetchType: 'none',
      });
    },
  });
}

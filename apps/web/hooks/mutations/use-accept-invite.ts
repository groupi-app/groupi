'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptInviteAction } from '@/actions/invite-actions';
import { qk } from '@/lib/query-keys';
import type { UserDashboardData, MemberListPageData, EventHeaderData } from '@groupi/schema/data';
import type { InviteMutationError } from '@/actions/invite-actions';

interface AcceptInviteInput {
  inviteId: string;
  eventId: string; // Passed from component since service doesn't return it
}

/**
 * Mutation hook for accepting an invite
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: AcceptInviteInput
    ): Promise<{ message: string; membershipId: string; eventId: string }> => {
      const [error, data] = await acceptInviteAction({
        inviteId: input.inviteId,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async (acceptedInvite: AcceptInviteInput) => {
      // Find user's event list query by searching cache
      const queryCache = queryClient.getQueryCache();
      const userEventQueries = queryCache.findAll({ 
        predicate: (query: { queryKey: readonly unknown[] }) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'events' && key[1] === 'list' && key.length === 3;
        }
      });
      
      // Find member list query for this event
      const memberListQuery = queryCache.find({ 
        queryKey: qk.memberships.list(acceptedInvite.eventId) 
      });
      
      // Find event header query to get event data
      const eventHeaderQuery = queryCache.find({ 
        queryKey: qk.events.header(acceptedInvite.eventId) 
      });
      
      // Save previous data for rollback
      const prevData = [
        ...userEventQueries.map((query: { queryKey: readonly unknown[]; state: { data: unknown } }) => ({
          queryKey: [...query.queryKey],
          data: query.state.data,
        })),
        ...(memberListQuery ? [{
          queryKey: [...memberListQuery.queryKey],
          data: memberListQuery.state.data,
        }] : []),
      ];

      // Get event data from header query if available
      const eventData = eventHeaderQuery?.state.data as EventHeaderData | undefined;
      const event = eventData?.event;

      // Optimistically add event to user's event list
      userEventQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        const userId = query.queryKey[2] as string | undefined;
        if (!userId) return;
        
        queryClient.setQueryData<UserDashboardData>(
          qk.events.listByUser(userId),
          (old: UserDashboardData | undefined) => {
            if (!old) return old;
            
            // Check if already in list
            if (old.memberships.some(m => m.event.id === acceptedInvite.eventId)) {
              return old;
            }
            
            // Create optimistic membership
            const optimisticMembership = {
              id: 'optimistic-' + Date.now(),
              role: 'ATTENDEE' as const,
              rsvpStatus: 'PENDING' as const,
              event: event ? {
                id: event.id,
                title: event.title,
                description: event.description || '',
                location: event.location || '',
                chosenDateTime: event.chosenDateTime,
                createdAt: new Date(),
                updatedAt: new Date(),
              } : {
                id: acceptedInvite.eventId,
                title: 'Loading...',
                description: '',
                location: '',
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

      // Optimistically add current user to member list
      if (memberListQuery && eventData) {
        queryClient.setQueryData<MemberListPageData>(
          qk.memberships.list(acceptedInvite.eventId),
          (old: MemberListPageData | undefined) => {
            if (!old) return old;
            
            // Check if already in list
            if (old.event.memberships.some(m => m.personId === eventData.userMembership.id)) {
              return old;
            }
            
            // Create optimistic membership - we need user data which we don't have
            // So we'll skip this and let Pusher handle it
            return old;
          }
        );
      }

      return { prevData };
    },
    onError: (_err: InviteMutationError, _acceptedInvite: AcceptInviteInput, ctx?: { prevData?: Array<{ queryKey: unknown[]; data: unknown }> }) => {
      // Rollback on error
      if (ctx?.prevData) {
        ctx.prevData.forEach(({ queryKey, data }: { queryKey: readonly unknown[]; data: unknown }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data) => {
      // Refetch active queries immediately (for current user's own join action)
      // Invalidate inactive queries (they'll refetch on mount)
      // Pusher will trigger real-time updates for other users
      queryClient.invalidateQueries({
        queryKey: qk.memberships.list(data.eventId),
        refetchType: 'active', // Refetch if query is currently active/mounted
      });
      queryClient.invalidateQueries({
        queryKey: qk.availability.data(data.eventId),
        refetchType: 'active', // Refetch if query is currently active/mounted
      });
      queryClient.invalidateQueries({
        queryKey: ['events'],
        refetchType: 'active', // Refetch active queries for user's event list
      });
    },
  });
}


'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRSVPAction } from '@/actions/membership-actions';
import { qk } from '@/lib/query-keys';
import type { MembershipData } from '@groupi/schema';
import type { EventHeaderData, MemberListPageData } from '@groupi/schema/data';
import type { MembershipMutationError } from '@/actions/membership-actions';

interface UpdateRSVPInput {
  eventId: string;
  status: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
}

/**
 * Mutation hook for updating RSVP status
 */
export function useUpdateRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (input: UpdateRSVPInput): Promise<MembershipData> => {
      const [error, data] = await updateRSVPAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (updatedRSVP: UpdateRSVPInput) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.events.header(updatedRSVP.eventId),
      });
      await queryClient.cancelQueries({
        queryKey: qk.memberships.list(updatedRSVP.eventId),
      });

      // Save previous data for rollback (same pattern as replies)
      // If not in cache, try to get from query options.initialData
      let prevEventHeader = queryClient.getQueryData<EventHeaderData>(
        qk.events.header(updatedRSVP.eventId)
      );
      let prevMemberList = queryClient.getQueryData<MemberListPageData>(
        qk.memberships.list(updatedRSVP.eventId)
      );

      // If not in cache, check if query exists and get initialData
      if (!prevEventHeader) {
        const queryCache = queryClient.getQueryCache();
        const query = queryCache.find({
          queryKey: qk.events.header(updatedRSVP.eventId),
        });
        const initialData = (
          query?.options as { initialData?: EventHeaderData }
        )?.initialData;
        if (initialData) {
          prevEventHeader = initialData;
          // Register it in cache now
          queryClient.setQueryData(
            qk.events.header(updatedRSVP.eventId),
            initialData
          );
        }
      }
      if (!prevMemberList) {
        const queryCache = queryClient.getQueryCache();
        const query = queryCache.find({
          queryKey: qk.memberships.list(updatedRSVP.eventId),
        });
        const initialData = (
          query?.options as {
            initialData?: MemberListPageData;
          }
        )?.initialData;
        if (initialData) {
          prevMemberList = initialData;
          // Register it in cache now
          queryClient.setQueryData(
            qk.memberships.list(updatedRSVP.eventId),
            initialData
          );
        }
      }

      // Optimistically update event header userMembership.rsvpStatus
      // Use same pattern as replies - call setQueryData directly, functional update handles undefined
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(updatedRSVP.eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            userMembership: {
              ...old.userMembership,
              rsvpStatus: updatedRSVP.status,
            },
          };
        }
      );

      // Optimistically update member list membership.rsvpStatus
      // Use same pattern as replies
      queryClient.setQueryData<MemberListPageData>(
        qk.memberships.list(updatedRSVP.eventId),
        (old: MemberListPageData | undefined) => {
          if (!old) return old;
          const currentUserMembershipId = old.userMembership?.id;
          if (!currentUserMembershipId) return old;
          return {
            ...old,
            event: {
              ...old.event,
              memberships: old.event.memberships.map(
                (m: MemberListPageData['event']['memberships'][number]) =>
                  m.id === currentUserMembershipId
                    ? { ...m, rsvpStatus: updatedRSVP.status }
                    : m
              ),
            },
          };
        }
      );

      return { prevEventHeader, prevMemberList };
    },
    onError: (
      _err: MembershipMutationError,
      updatedRSVP: UpdateRSVPInput,
      ctx?: {
        prevEventHeader?: EventHeaderData;
        prevMemberList?: MemberListPageData;
      }
    ) => {
      // Rollback on error
      if (ctx?.prevEventHeader) {
        queryClient.setQueryData(
          qk.events.header(updatedRSVP.eventId),
          ctx.prevEventHeader
        );
      }
      if (ctx?.prevMemberList) {
        queryClient.setQueryData(
          qk.memberships.list(updatedRSVP.eventId),
          ctx.prevMemberList
        );
      }
    },
    onSuccess: (data: MembershipData, variables: UpdateRSVPInput) => {
      // Update with real data immediately (following post update pattern)
      // Pusher will also broadcast to other users for real-time updates

      // Update event header with real data
      // If query doesn't exist, create it with the server data
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(variables.eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) {
            // Query doesn't exist - create it with minimal data
            // The component will fetch full data on next render
            console.log('[RSVP] onSuccess - creating query entry');
            return {
              event: {
                id: variables.eventId,
                title: '',
                description: '',
                location: '',
                chosenDateTime: null,
              },
              userMembership: {
                id: data.id,
                role: 'ATTENDEE' as const,
                rsvpStatus: data.rsvpStatus,
              },
            };
          }

          return {
            ...old,
            userMembership: {
              ...old.userMembership,
              rsvpStatus: data.rsvpStatus,
            },
          };
        }
      );

      // Update member list with real data
      // If query doesn't exist, skip (component will fetch on mount)
      queryClient.setQueryData<MemberListPageData>(
        qk.memberships.list(variables.eventId),
        (old: MemberListPageData | undefined) => {
          if (!old) {
            console.log(
              '[RSVP] onSuccess - member list query not found, skipping'
            );
            return old; // Skip if query doesn't exist
          }

          return {
            ...old,
            event: {
              ...old.event,
              memberships: old.event.memberships.map(m =>
                m.id === data.id ? { ...m, rsvpStatus: data.rsvpStatus } : m
              ),
            },
          };
        }
      );

      // Don't invalidate queries - setQueryData already updated the cache
      // Pusher will handle real-time updates for other users via member-changed event
      // For the same user, the optimistic update is already replaced with real data above
    },
  });
}

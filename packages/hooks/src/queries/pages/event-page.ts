import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';
import {
  EventHeaderDTO as EventHeaderSchema,
  PersonSchema,
  MembershipSchema,
} from '@groupi/schema';
import type {
  EventHeaderDTO,
  MemberListPageDTO,
  ResultTuple,
} from '@groupi/schema';

// ============================================================================
// EVENT PAGE COMPONENT HOOKS
// ============================================================================

/**
 * Hook for EventHeader component
 * Fetches only the data needed for event header display
 * Includes built-in real-time sync via Supabase
 */
export function useEventHeader(eventId: string) {
  // Standard tRPC query
  const query = api.event.getHeaderData.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for event changes
  useSupabaseRealtime(
    {
      channel: `event-header-${eventId}`,
      changes: [
        {
          table: 'Event',
          filter: `id=eq.${eventId}`,
          event: '*',
          handler: ({ newRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getHeaderData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: ResultTuple<unknown, EventHeaderDTO> | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                const parsed = EventHeaderSchema.shape.event
                  .partial()
                  .safeParse(newRow);
                if (!parsed.success) return oldValue;
                const updated = parsed.data;
                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, ...updated },
                  },
                ] as ResultTuple<unknown, EventHeaderDTO>;
              }
            );
          },
        },
        {
          table: 'Membership',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ newRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getHeaderData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: ResultTuple<unknown, EventHeaderDTO> | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                const parsed = MembershipSchema.partial().safeParse(newRow);
                if (!parsed.success) return oldValue;
                const updated = parsed.data;
                if (updated.id === data.userMembership.id) {
                  return [
                    null,
                    {
                      ...data,
                      userMembership: {
                        ...data.userMembership,
                        ...updated,
                      },
                    },
                  ] as ResultTuple<unknown, EventHeaderDTO>;
                }
                return oldValue;
              }
            );
          },
        },
      ],
    },
    [eventId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}

/**
 * Hook for MemberList component
 * Fetches only the data needed for member list display
 * Includes built-in real-time sync via Supabase
 */
export function useMemberList(eventId: string) {
  // Standard tRPC query
  const query = api.event.getMemberListData.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for membership changes
  useSupabaseRealtime(
    {
      channel: `member-list-${eventId}`,
      changes: [
        {
          table: 'Membership',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ event, newRow, oldRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getMemberListData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (
                oldValue: ResultTuple<unknown, MemberListPageDTO> | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                const memberships = [...data.event.memberships];
                const idToMatch = (
                  event === 'DELETE'
                    ? (oldRow as { id?: string } | null)?.id
                    : (newRow as { id?: string } | null)?.id
                ) as string | undefined;
                const membershipIndex = idToMatch
                  ? memberships.findIndex(m => m.id === idToMatch)
                  : -1;

                if (event === 'INSERT') {
                  // Add new membership (need to fetch person data)
                  queryClient.invalidateQueries({
                    queryKey: [
                      ['event', 'getMemberListData'],
                      { input: { id: eventId }, type: 'query' },
                    ],
                  });
                  return oldValue;
                }

                if (event === 'UPDATE' && membershipIndex >= 0 && newRow) {
                  const parsed = MembershipSchema.partial().safeParse(newRow);
                  if (!parsed.success) return oldValue;
                  memberships[membershipIndex] = {
                    ...memberships[membershipIndex],
                    ...parsed.data,
                  };
                  return [
                    null,
                    {
                      ...data,
                      event: { ...data.event, memberships },
                    },
                  ] as ResultTuple<unknown, MemberListPageDTO>;
                }

                if (event === 'DELETE' && membershipIndex >= 0) {
                  memberships.splice(membershipIndex, 1);
                  return [
                    null,
                    {
                      ...data,
                      event: { ...data.event, memberships },
                    },
                  ] as ResultTuple<unknown, MemberListPageDTO>;
                }

                return oldValue;
              }
            );
          },
        },
        {
          table: 'Person',
          filter: `id=in.(${query.data?.[1]?.event.memberships.map(m => m.person.id).join(',') || ''})`,
          event: '*',
          handler: ({ newRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getMemberListData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (
                oldValue: ResultTuple<unknown, MemberListPageDTO> | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                const parsed = PersonSchema.partial().safeParse(newRow);
                if (!parsed.success) return oldValue;
                const personUpdate = parsed.data;

                const memberships = data.event.memberships.map(membership => {
                  if (membership.person.id === personUpdate.id) {
                    return {
                      ...membership,
                      person: { ...membership.person, ...personUpdate },
                    };
                  }
                  return membership;
                });

                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, memberships },
                  },
                ] as ResultTuple<unknown, MemberListPageDTO>;
              }
            );
          },
        },
      ],
    },
    [eventId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}

/**
 * Hook for PostFeed component
 * Fetches only the data needed for post feed display
 * Includes built-in real-time sync via Supabase
 */
export function usePostFeed(eventId: string) {
  // Standard tRPC query
  const query = api.post.getPostFeedData.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for post changes
  useSupabaseRealtime(
    {
      channel: `post-feed-${eventId}`,
      changes: [
        {
          table: 'Post',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            queryClient.invalidateQueries({
              queryKey: [
                ['event', 'getPostFeedData'],
                { input: { id: eventId }, type: 'query' },
              ],
            });
          },
        },
        {
          table: 'Reply',
          filter: `postId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            queryClient.invalidateQueries({
              queryKey: [
                ['event', 'getPostFeedData'],
                { input: { id: eventId }, type: 'query' },
              ],
            });
          },
        },
        {
          table: 'Person',
          filter: '*',
          event: '*',
          handler: ({ queryClient }) => {
            queryClient.invalidateQueries({
              queryKey: [
                ['event', 'getPostFeedData'],
                { input: { id: eventId }, type: 'query' },
              ],
            });
          },
        },
      ],
    },
    [eventId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}

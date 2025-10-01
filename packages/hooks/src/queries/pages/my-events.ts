import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';

// ============================================================================
// MY EVENTS PAGE HOOK
// ============================================================================

/**
 * Hook for MyEvents page
 * Fetches all events for a user through their memberships
 * Includes built-in real-time sync via Supabase
 */
export function useMyEvents() {
  // Standard tRPC query
  const query = api.person.getMyEventsData.useQuery(undefined, {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  // Real-time sync for membership and event changes
  useSupabaseRealtime(
    {
      channel: `my-events`,
      changes: [
        {
          table: 'Membership',
          event: '*',
          filter: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch all data
            queryClient.invalidateQueries({
              queryKey: [['person', 'getMyEventsData'], { type: 'query' }],
            });
          },
        },
        {
          table: 'Event',
          event: '*',
          filter: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch all data
            queryClient.invalidateQueries({
              queryKey: [['person', 'getMyEventsData'], { type: 'query' }],
            });
          },
        },
        {
          table: 'Person',
          event: '*',
          filter: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch all data
            queryClient.invalidateQueries({
              queryKey: [['person', 'getMyEventsData'], { type: 'query' }],
            });
          },
        },
      ],
    },
    []
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

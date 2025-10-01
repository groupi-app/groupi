import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';

// ============================================================================
// EVENT CHANGE DATE MULTI PAGE HOOK
// ============================================================================

/**
 * Hook for Event Change Date Multi page
 * Fetches event info with potential date times
 * Includes real-time sync for potential date time changes
 */
export function useEventChangeDateMulti(eventId: string) {
  // Standard tRPC query
  const query = api.event.getHeaderData.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for potential date time changes
  useSupabaseRealtime(
    {
      channel: `event-change-date-multi-${eventId}`,
      changes: [
        {
          table: 'PotentialDateTime',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch potential date times
            queryClient.invalidateQueries({
              queryKey: [
                ['event', 'getHeaderData'],
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

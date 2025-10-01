import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';

// ============================================================================
// EVENT AVAILABILITY PAGE HOOK
// ============================================================================

/**
 * Hook for Event Availability page
 * Fetches potential date/time options with availability votes
 * Includes real-time sync for availability changes
 */
export function useEventAvailability(eventId: string) {
  // Standard tRPC query
  const query = api.availability.getEventPotentialDateTimes.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for availability changes
  useSupabaseRealtime(
    {
      channel: `event-availability-${eventId}`,
      changes: [
        {
          table: 'Availability',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch availability data
            queryClient.invalidateQueries({
              queryKey: [
                ['availability', 'getAvailabilityPageData'],
                { input: { eventId }, type: 'query' },
              ],
            });
          },
        },
        {
          table: 'PotentialDateTime',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query when date options change
            queryClient.invalidateQueries({
              queryKey: [
                ['availability', 'getAvailabilityPageData'],
                { input: { eventId }, type: 'query' },
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

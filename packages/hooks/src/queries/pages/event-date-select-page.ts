import { api } from '../clients/trpc-client';
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import type { EventDateSelectPageResult } from '@groupi/schema';

// ============================================================================
// EVENT DATE SELECT PAGE HOOK
// ============================================================================

/**
 * Hook for Event Date Select page (organizer-only)
 * Fetches potential date/time options with availability votes
 * Includes real-time sync for availability changes
 */
export function useEventDateSelect(eventId: string) {
  // Standard tRPC query
  const query = api.availability.getDateSelectPageData.useQuery(
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
      channel: `event-date-select-${eventId}`,
      changes: [
        {
          table: 'Availability',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch availability data
            queryClient.invalidateQueries({
              queryKey: [
                ['availability', 'getDateSelectPageData'],
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
                ['availability', 'getDateSelectPageData'],
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

// Alias for backward compatibility with existing components
export const usePDTs = useEventDateSelect;

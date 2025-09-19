import { api } from '../clients/trpc-client';
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import type { EventChangeDateSinglePageResult } from '@groupi/schema';

// ============================================================================
// EVENT CHANGE DATE SINGLE PAGE HOOK
// ============================================================================

/**
 * Hook for Event Change Date Single page
 * Fetches event info with current date
 * Includes real-time sync for event date changes
 */
export function useEventChangeDateSingle(eventId: string) {
  // Standard tRPC query
  const query = api.event.getChangeDateSinglePageData.useQuery(
    { id: eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for event date changes
  useSupabaseRealtime(
    {
      channel: `event-change-date-single-${eventId}`,
      changes: [
        {
          table: 'Event',
          filter: `id=eq.${eventId}`,
          event: 'UPDATE',
          handler: ({ payload, queryClient }) => {
            // Update the query data when event date is changed
            queryClient.setQueryData(
              [
                ['event', 'getChangeDateSinglePageData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: EventChangeDateSinglePageResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                return [
                  null,
                  {
                    ...data,
                    event: {
                      ...data.event,
                      chosenDateTime:
                        payload.new?.chosenDateTime ||
                        data.event.chosenDateTime,
                    },
                  },
                ] as EventChangeDateSinglePageResult;
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

import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';
import { EventSchema } from '@groupi/schema';
import type { ResultTuple } from '@groupi/schema';
// No dedicated DTO; use minimal event subset shape for result typing
import type { EventDetailsDTO as EventChangeDateSinglePageResult } from '@groupi/schema';

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
  const query = api.event.getHeaderData.useQuery(
    { eventId },
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
          handler: ({ newRow, queryClient }) => {
            // Update the query data when event date is changed
            queryClient.setQueryData(
              [
                ['event', 'getChangeDateSinglePageData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (
                oldValue:
                  | ResultTuple<unknown, EventChangeDateSinglePageResult>
                  | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;
                const parsed = EventSchema.pick({ chosenDateTime: true })
                  .partial()
                  .safeParse(newRow);
                if (!parsed.success) return oldValue;
                return [
                  null,
                  {
                    ...data,
                    event: {
                      ...data.event,
                      ...parsed.data,
                    },
                  },
                ] as ResultTuple<unknown, EventChangeDateSinglePageResult>;
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

import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';
import { EventSchema } from '@groupi/schema';
import type { ResultTuple } from '@groupi/schema';
// No specific EditPage DTO exists; use EventHeaderDTO/event subset shape if needed
import type { EventHeaderDTO as EventEditPageResult } from '@groupi/schema';

// ============================================================================
// EVENT EDIT PAGE HOOK
// ============================================================================

/**
 * Hook for Event Edit page
 * Fetches event details for editing
 * Includes real-time sync for event updates
 */
export function useEventEdit(eventId: string) {
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
      channel: `event-edit-${eventId}`,
      changes: [
        {
          table: 'Event',
          filter: `id=eq.${eventId}`,
          event: 'UPDATE',
          handler: ({ newRow, queryClient }) => {
            // Update the query data when event is edited
            queryClient.setQueryData(
              [
                ['event', 'getEditPageData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (
                oldValue: ResultTuple<unknown, EventEditPageResult> | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;
                const parsed = EventSchema.partial().safeParse(newRow);
                if (!parsed.success) return oldValue;
                const patch = parsed.data;
                return [
                  null,
                  {
                    ...data,
                    event: {
                      ...data.event,
                      ...patch,
                    },
                  },
                ] as ResultTuple<unknown, EventEditPageResult>;
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

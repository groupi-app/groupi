import { api } from '../clients/trpc-client';
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import type { EventEditPageResult } from '@groupi/schema';

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
  const query = api.event.getEditPageData.useQuery(
    { id: eventId },
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
          handler: ({ payload, queryClient }) => {
            // Update the query data when event is edited
            queryClient.setQueryData(
              [
                ['event', 'getEditPageData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: EventEditPageResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                return [
                  null,
                  {
                    ...data,
                    event: {
                      ...data.event,
                      title: payload.new?.title || data.event.title,
                      description: payload.new?.description || data.event.description,
                      location: payload.new?.location || data.event.location,
                    },
                  },
                ] as EventEditPageResult;
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

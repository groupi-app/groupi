import { api } from '../clients/trpc-client';

// ============================================================================
// EVENT CHANGE DATE PAGE HOOK
// ============================================================================

/**
 * Hook for Event Change Date page
 * Fetches basic event info and verifies user is an organizer
 * No real-time sync needed as this is just for page authorization
 */
export function useEventChangeDate(eventId: string) {
  // Standard tRPC query
  const query = api.event.getChangeDatePageData.useQuery(
    { id: eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

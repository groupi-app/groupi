import { api } from '../../clients/trpc-client';

// ============================================================================
// EVENT NEW POST PAGE HOOK
// ============================================================================

/**
 * Hook for Event New Post page
 * Fetches basic event info and verifies user membership
 * No real-time sync needed as this is just for page authorization
 */
export function useEventNewPost(eventId: string) {
  // Standard tRPC query
  const query = api.event.getNewPostPageData.useQuery(
    { eventId },
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

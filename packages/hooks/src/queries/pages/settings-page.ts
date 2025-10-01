import { api } from '../../clients/trpc-client';

// ============================================================================
// SETTINGS PAGE HOOK
// ============================================================================

/**
 * Hook for Settings page
 * Fetches user settings with notification methods
 * Note: No real-time sync needed as settings don't change frequently
 */
export function useSettingsPage() {
  // Standard tRPC query
  const query = api.settings.getSettingsPageData.useQuery(undefined, {
    staleTime: 60 * 1000, // Longer stale time as settings don't change often
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

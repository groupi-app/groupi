import { api } from '../../clients/trpc-client';

// ============================================================================
// INVITE PAGE HOOK
// ============================================================================

/**
 * Hook for Invite page
 * Fetches invite data with event details for display
 * Note: No real-time sync needed as invites don't change frequently
 */
export function useInvitePage(inviteId: string) {
  // Standard tRPC query
  const query = api.invite.getInvitePageData.useQuery(
    { inviteId },
    {
      staleTime: 60 * 1000, // Longer stale time as invites don't change often
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

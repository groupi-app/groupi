import { api } from '../clients/trpc-client';
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import type { EventInvitePageResult } from '@groupi/schema';

// ============================================================================
// EVENT INVITE PAGE HOOK
// ============================================================================

/**
 * Hook for Event Invite page
 * Fetches event invites for management
 * Includes real-time sync for invite changes
 */
export function useEventInvites(eventId: string) {
  // Standard tRPC query
  const query = api.invite.getEventInvitePageData.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for invite changes
  useSupabaseRealtime(
    {
      channel: `event-invites-${eventId}`,
      changes: [
        {
          table: 'Invite',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch invite data
            queryClient.invalidateQueries({
              queryKey: [
                ['invite', 'getEventInvitePageData'],
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

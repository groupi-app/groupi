import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';
import { PersonSchema } from '@groupi/schema';
import type { EventAttendeesPageDTO, ResultTuple } from '@groupi/schema';

// ============================================================================
// EVENT ATTENDEES PAGE HOOK
// ============================================================================

/**
 * Hook for Event Attendees page
 * Fetches event attendees with their RSVP status
 * Includes real-time sync for membership and RSVP changes
 */
export function useEventAttendees(eventId: string) {
  // Standard tRPC query
  const query = api.event.getAttendeesPageData.useQuery(
    { eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for membership changes
  useSupabaseRealtime(
    {
      channel: `event-attendees-${eventId}`,
      changes: [
        {
          table: 'Membership',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // Invalidate the query to refetch attendees data
            queryClient.invalidateQueries({
              queryKey: [
                ['event', 'getAttendeesPageData'],
                { input: { id: eventId }, type: 'query' },
              ],
            });
          },
        },
        {
          table: 'Person',
          event: '*',
          filter: '',
          handler: ({ newRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getAttendeesPageData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (
                oldValue:
                  | ResultTuple<unknown, EventAttendeesPageDTO>
                  | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;
                const parsed = PersonSchema.partial().safeParse(newRow);
                if (!parsed.success) return oldValue;
                const personPatch = parsed.data;

                const updatedMemberships = data.event.memberships.map(
                  membership => {
                    if (membership.person.id === personPatch.id) {
                      return {
                        ...membership,
                        person: { ...membership.person, ...personPatch },
                      };
                    }
                    return membership;
                  }
                );

                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, memberships: updatedMemberships },
                  },
                ] as ResultTuple<unknown, EventAttendeesPageDTO>;
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

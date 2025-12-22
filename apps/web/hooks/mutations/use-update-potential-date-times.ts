'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePotentialDateTimesAction } from '@/actions/availability-actions';
import { qk } from '@/lib/query-keys';
import type { AvailabilityPageData } from '@groupi/schema/data';
import type { AvailabilityMutationError } from '@/actions/availability-actions';

interface UpdatePotentialDateTimesInput {
  eventId: string;
  potentialDateTimes: Date[];
}

/**
 * Mutation hook for updating potential date times for an event
 * Includes optimistic updates for immediate UI feedback
 */
export function useUpdatePotentialDateTimes() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: UpdatePotentialDateTimesInput
    ): Promise<{ message: string }> => {
      const [error, data] = await updatePotentialDateTimesAction({
        eventId: input.eventId,
        potentialDateTimes: input.potentialDateTimes.map(dt => dt.toISOString()),
      });
      if (error) throw error;
      return data;
    },
    onMutate: async (input: UpdatePotentialDateTimesInput) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.availability.data(input.eventId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<AvailabilityPageData>(
        qk.availability.data(input.eventId)
      );

      // Optimistically update potential date times
      // Create temporary IDs for new potential date times (will be replaced by server response)
      queryClient.setQueryData<AvailabilityPageData>(
        qk.availability.data(input.eventId),
        (old: AvailabilityPageData | undefined) => {
          // Find organizer's membership from old data (if available)
          let organizerMembership: AvailabilityPageData['potentialDateTimes'][0]['availabilities'][0]['membership'] | null = null;
          
          if (old) {
            // Look for organizer membership in existing availabilities
            for (const pdt of old.potentialDateTimes) {
              const organizerAvail = pdt.availabilities.find(
                avail => avail.membership.role === 'ORGANIZER'
              );
              if (organizerAvail) {
                organizerMembership = organizerAvail.membership;
                break;
              }
            }
          }

          // If not found in availability data, try to get from memberships list cache
          if (!organizerMembership) {
            const membershipsData = queryClient.getQueryData<{
              event: {
                memberships: Array<{
                  id: string;
                  personId: string;
                  eventId: string;
                  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
                  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
                  person: {
                    id: string;
                    user: {
                      name: string | null;
                      email: string;
                      image: string | null;
                      username: string | null;
                    };
                  };
                }>;
              };
            }>(qk.memberships.list(input.eventId));

            if (membershipsData) {
              const organizer = membershipsData.event.memberships.find(
                m => m.role === 'ORGANIZER'
              );
              if (organizer) {
                // Create membership structure matching AvailabilityPageData format
                organizerMembership = {
                  id: organizer.id,
                  personId: organizer.personId,
                  eventId: organizer.eventId,
                  role: organizer.role,
                  rsvpStatus: organizer.rsvpStatus,
                  person: {
                    id: organizer.person.id,
                    user: organizer.person.user,
                  },
                };
              }
            }
          }

          // Create new potential date times with organizer's availability optimistically set to YES
          const newPotentialDateTimes = input.potentialDateTimes.map((dt, index) => {
            const availabilities = organizerMembership
              ? [
                  {
                    status: 'YES' as const,
                    membership: organizerMembership,
                  },
                ]
              : [];

            return {
              id: `temp-${index}-${Date.now()}`,
              eventId: input.eventId,
              dateTime: dt,
              availabilities,
            };
          });

          if (!old) {
            // If no existing data, create new structure
            return {
              potentialDateTimes: newPotentialDateTimes,
              userRole: 'ORGANIZER' as const,
              userId: organizerMembership?.personId || '', // Use organizer's personId if found
            };
          }

          // Replace all potential date times with new ones, preserve userRole and userId
          return {
            ...old,
            potentialDateTimes: newPotentialDateTimes,
          };
        }
      );

      return { prev };
    },
    onError: (
      _err: AvailabilityMutationError,
      input: UpdatePotentialDateTimesInput,
      ctx?: { prev?: AvailabilityPageData }
    ) => {
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(
          qk.availability.data(input.eventId),
          ctx.prev
        );
      }
    },
    onSuccess: (_data: { message: string }, variables: UpdatePotentialDateTimesInput) => {
      // Invalidate to refetch with real data from server
      // This ensures we get the correct IDs and any server-side data
      queryClient.invalidateQueries({
        queryKey: qk.availability.data(variables.eventId),
      });
    },
  });
}


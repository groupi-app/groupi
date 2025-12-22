'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAvailabilitiesAction } from '@/actions/availability-actions';
import { qk } from '@/lib/query-keys';
import type { AvailabilityPageData } from '@groupi/schema/data';
import type { AvailabilityMutationError } from '@/actions/availability-actions';

interface UpdateAvailabilitiesInput {
  eventId: string;
  availabilityUpdates: Array<{
    potentialDateTimeId: string;
    status: 'YES' | 'NO' | 'MAYBE';
  }>;
}

/**
 * Mutation hook for updating availability with optimistic updates
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: UpdateAvailabilitiesInput
    ): Promise<{ message: string }> => {
      const [error, data] = await updateAvailabilitiesAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (input: UpdateAvailabilitiesInput) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.availability.data(input.eventId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<AvailabilityPageData>(
        qk.availability.data(input.eventId)
      );

      // Optimistically update cache
      queryClient.setQueryData<AvailabilityPageData>(
        qk.availability.data(input.eventId),
        (old: AvailabilityPageData | undefined) => {
          if (!old) return old;

          // Get current user's membership from existing availabilities
          // Find any availability entry for the current user to get their membership data
          let userMembership:
            | AvailabilityPageData['potentialDateTimes'][0]['availabilities'][0]['membership']
            | null = null;

          for (const pdt of old.potentialDateTimes) {
            const userAvailability = pdt.availabilities.find(
              (
                avail: AvailabilityPageData['potentialDateTimes'][0]['availabilities'][0]
              ) => avail.membership.person.id === old.userId
            );
            if (userAvailability) {
              userMembership = userAvailability.membership;
              break;
            }
          }

          // If no existing availability, try to get membership from memberships cache
          if (!userMembership) {
            const memberListData = queryClient.getQueryData<
              import('@groupi/schema/data').MemberListPageData
            >(qk.memberships.list(input.eventId));
            const userMember = memberListData?.event.memberships.find(
              (
                m: import('@groupi/schema/data').MemberListPageData['event']['memberships'][0]
              ) => m.personId === old.userId
            );
            if (userMember) {
              userMembership = {
                id: userMember.id,
                personId: userMember.personId,
                eventId: userMember.eventId,
                role: userMember.role,
                rsvpStatus: userMember.rsvpStatus,
                person: {
                  id: userMember.person.id,
                  user: {
                    name: userMember.person.user.name,
                    email: userMember.person.user.email,
                    image: userMember.person.user.image,
                    username: userMember.person.user.username,
                  },
                },
              };
            }
          }

          // If still no membership data, skip optimistic update (will still get immediate UI feedback)
          if (!userMembership) {
            return old;
          }

          // Create a map of updates for quick lookup
          const updatesMap = new Map(
            input.availabilityUpdates.map(
              (update: {
                potentialDateTimeId: string;
                status: 'YES' | 'NO' | 'MAYBE';
              }) => [update.potentialDateTimeId, update.status]
            )
          );

          // Update each potential date time with optimistic availability data
          return {
            ...old,
            potentialDateTimes: old.potentialDateTimes.map(
              (pdt: AvailabilityPageData['potentialDateTimes'][0]) => {
                const newStatus = updatesMap.get(pdt.id);
                if (!newStatus) {
                  return pdt;
                }

                // Check if user already has an availability for this potentialDateTime
                const existingAvailabilityIndex = pdt.availabilities.findIndex(
                  (
                    avail: AvailabilityPageData['potentialDateTimes'][0]['availabilities'][0]
                  ) => avail.membership.person.id === old.userId
                );

                if (existingAvailabilityIndex >= 0) {
                  // Update existing availability
                  const updatedAvailabilities = [...pdt.availabilities];
                  updatedAvailabilities[existingAvailabilityIndex] = {
                    ...updatedAvailabilities[existingAvailabilityIndex],
                    status: newStatus,
                  };
                  return {
                    ...pdt,
                    availabilities: updatedAvailabilities,
                  };
                } else {
                  // Create new availability entry
                  return {
                    ...pdt,
                    availabilities: [
                      ...pdt.availabilities,
                      {
                        status: newStatus,
                        membership: userMembership,
                      },
                    ],
                  };
                }
              }
            ),
          };
        }
      );

      return { prev };
    },
    onError: (
      _err: AvailabilityMutationError,
      input: UpdateAvailabilitiesInput,
      ctx?: { prev?: AvailabilityPageData }
    ) => {
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(qk.availability.data(input.eventId), ctx.prev);
      }
    },
    onSuccess: () => {
      // Don't invalidate immediately - let Pusher handle the real-time update
      // This prevents double updates and makes the transition seamless
      // Pusher will trigger availability-changed event which will update the cache
    },
  });
}

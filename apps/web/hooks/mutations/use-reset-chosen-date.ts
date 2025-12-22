'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetChosenDateAction } from '@/actions/availability-actions';
import { qk } from '@/lib/query-keys';
import type { EventHeaderData } from '@groupi/schema/data';
import type { AvailabilityMutationError } from '@/actions/availability-actions';

interface ResetChosenDateInput {
  eventId: string;
}

/**
 * Mutation hook for resetting the chosen date/time for an event
 * Sets chosenDateTime to null to start a new poll
 */
export function useResetChosenDate() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: ResetChosenDateInput
    ): Promise<{ message: string }> => {
      const [error, data] = await resetChosenDateAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (input: ResetChosenDateInput) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.events.header(input.eventId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<EventHeaderData>(
        qk.events.header(input.eventId)
      );

      // Optimistically update event header chosenDateTime to null
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(input.eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            event: {
              ...old.event,
              chosenDateTime: null,
            },
          };
        }
      );

      return { prev };
    },
    onError: (
      _err: AvailabilityMutationError,
      input: ResetChosenDateInput,
      ctx?: { prev?: EventHeaderData }
    ) => {
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(
          qk.events.header(input.eventId),
          ctx.prev
        );
      }
    },
    onSuccess: (_data: { message: string }, variables: ResetChosenDateInput) => {
      // Update cache with real data immediately (following RSVP update pattern)
      // Pusher will also broadcast to other users for real-time updates
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(variables.eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            event: {
              ...old.event,
              chosenDateTime: null,
            },
          };
        }
      );

      // Don't invalidate queries - setQueryData already updated the cache
      // Pusher will handle real-time updates for other users via event-changed event
      // For the same user, the optimistic update is already replaced with real data above
    },
  });
}


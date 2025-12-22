'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chooseDateTimeAction } from '@/actions/availability-actions';
import { qk } from '@/lib/query-keys';
import type { EventHeaderData } from '@groupi/schema/data';
import type { AvailabilityMutationError } from '@/actions/availability-actions';

interface ChooseDateTimeInput {
  eventId: string;
  pdtId: string;
  chosenDateTime: Date; // Passed from component since action doesn't return it
}

/**
 * Mutation hook for choosing the final date/time for an event
 */
export function useChooseDateTime() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: ChooseDateTimeInput
    ): Promise<{ message: string }> => {
      const [error, data] = await chooseDateTimeAction({
        eventId: input.eventId,
        pdtId: input.pdtId,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async (chosenDateTime: ChooseDateTimeInput) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.events.header(chosenDateTime.eventId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<EventHeaderData>(
        qk.events.header(chosenDateTime.eventId)
      );

      // Optimistically update event header chosenDateTime
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(chosenDateTime.eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            event: {
              ...old.event,
              chosenDateTime: chosenDateTime.chosenDateTime,
            },
          };
        }
      );

      return { prev };
    },
    onError: (
      _err: AvailabilityMutationError,
      chosenDateTime: ChooseDateTimeInput,
      ctx?: { prev?: EventHeaderData }
    ) => {
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(
          qk.events.header(chosenDateTime.eventId),
          ctx.prev
        );
      }
    },
    onSuccess: (_data: { message: string }, variables: ChooseDateTimeInput) => {
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
              chosenDateTime: variables.chosenDateTime,
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

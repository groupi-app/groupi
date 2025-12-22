'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEventDetailsAction } from '@/actions/event-actions';
import { qk } from '@/lib/query-keys';
import type { EventHeaderData } from '@groupi/schema/data';
import type { EventMutationError } from '@/actions/event-actions';
import type { UpdateEventDetailsParams } from '@groupi/schema/params';

/**
 * Helper to convert date strings to Date objects in EventHeaderData
 */
function convertEventHeaderDates(data: EventHeaderData): EventHeaderData {
  return {
    ...data,
    event: {
      ...data.event,
      chosenDateTime: data.event.chosenDateTime
        ? data.event.chosenDateTime instanceof Date
          ? data.event.chosenDateTime
          : new Date(data.event.chosenDateTime)
        : null,
    },
  };
}

/**
 * Mutation hook for updating event details with optimistic updates
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: UpdateEventDetailsParams
    ): Promise<EventHeaderData> => {
      const [error, data] = await updateEventDetailsAction(input);
      if (error) throw error;
      // Convert date strings back to Date objects (server actions serialize dates as strings)
      return convertEventHeaderDates(data);
    },
    onMutate: async (updatedEvent: UpdateEventDetailsParams) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: qk.events.header(updatedEvent.eventId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<EventHeaderData>(
        qk.events.header(updatedEvent.eventId)
      );

      // Optimistically update cache
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(updatedEvent.eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            event: {
              ...old.event,
              ...updatedEvent,
              optimistic: true,
            },
          };
        }
      );

      return { prev };
    },
    onError: (
      _err: EventMutationError,
      updatedEvent: UpdateEventDetailsParams,
      ctx?: { prev?: EventHeaderData }
    ) => {
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(
          qk.events.header(updatedEvent.eventId),
          ctx.prev
        );
      }
    },
    onSuccess: (
      _data: EventHeaderData,
      variables: UpdateEventDetailsParams
    ) => {
      // Don't replace optimistic update immediately - let Pusher handle the real-time update
      // This prevents double updates and makes the transition seamless
      // Pusher will trigger event-changed event which will update the cache
      // Silently invalidate for background sync
      queryClient.invalidateQueries({
        queryKey: qk.events.header(variables.eventId),
        refetchType: 'none',
      });
    },
  });
}

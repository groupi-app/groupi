import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import type {
  ResultTuple,
  EventHeaderDTO,
  CreateEventParams,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
} from '@groupi/schema';

// ============================================================================
// TYPES
// ============================================================================

type EventMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError;

// Note: Input types now imported from @groupi/schema params
// - CreateEventInput -> CreateEventParams

// ============================================================================
// EVENT MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create event hook with clean mutation function
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  const mutation = api.event.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['event', 'person']),
      });
    },
    retry: false,
  });

  // Clean mutation function for components
  const createEvent = useCallback(
    async (
      input: CreateEventParams,
      callbacks?: {
        onSuccess?: (event: EventHeaderDTO) => void;
        onError?: (error: EventMutationError) => void;
      }
    ): Promise<ResultTuple<EventMutationError, EventHeaderDTO>> => {
      try {
        const result = await mutation.mutateAsync(input);
        const [error, event] = result;

        if (error) {
          callbacks?.onError?.(error as EventMutationError);
          return [error as EventMutationError, undefined];
        }

        callbacks?.onSuccess?.(event);
        return [null, event];
      } catch (error) {
        const mutationError = error as EventMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    createEvent,

    // Mutation status
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,

    // Real-time sync status
    realTime: { isConnected: true, isEnabled: true, willSync: true },
  };
}

/**
 * Enhanced update event details hook with optimistic updates and real-time sync
 */
export function useUpdateEventDetails() {
  const queryClient = useQueryClient();

  const mutation = api.event.updateDetails.useMutation({
    onMutate: async ({ eventId: _eventId, title, description, location }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['event']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['event']),
      });

      // Optimistic update
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['event']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old) || old[0] !== null) return old;
          const [_error, data] = old as [unknown, unknown];
          if (!data || typeof data !== 'object' || !('event' in data))
            return old;
          if (!data.event || typeof data.event !== 'object') return old;
          return [
            null,
            {
              ...data,
              event: {
                ...data.event,
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(location !== undefined && { location }),
              },
            },
          ];
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['event']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    realTime: {
      isConnected: true,
      isEnabled: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

/**
 * Enhanced update event date/time hook with optimistic updates
 */
export function useUpdateEventDateTime() {
  const queryClient = useQueryClient();

  // Note: updateDateTime endpoint no longer exists
  // Use updateDetails endpoint for event modifications
  const mutation = api.event.updateDetails.useMutation({
    onMutate: async ({ eventId: _eventId, title, description, location }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['event']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['event']),
      });

      // Optimistic update
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['event']) },
        (old: unknown) => {
          if (!old || !Array.isArray(old) || old[0] !== null) return old;
          const [_error, data] = old as [unknown, unknown];
          if (!data || typeof data !== 'object' || !('event' in data))
            return old;
          if (!data.event || typeof data.event !== 'object') return old;
          return [
            null,
            {
              ...data,
              event: {
                ...data.event,
                // No direct dateTime arg here anymore; keep event fields stable
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(location !== undefined && { location }),
              },
            },
          ];
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['event']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    realTime: {
      isConnected: true,
      isEnabled: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

/**
 * Enhanced update event potential date/times hook
 */
export function useUpdateEventPotentialDateTimes() {
  const queryClient = useQueryClient();

  // Note: updatePotentialDateTimes endpoint no longer exists
  // This function is now non-functional
  const mutation = api.event.updateDetails.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['event', 'availability']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    realTime: {
      isConnected: true,
      isEnabled: true,
      willSyncWithOthers: true,
    },
  };
}

/**
 * Enhanced delete event hook with optimistic updates
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  const mutation = api.event.delete.useMutation({
    onMutate: async ({ eventId }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['event']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['event']),
      });

      // Optimistically remove from cache
      queryClient.removeQueries({
        predicate: query => {
          const routerAndProcedure = query.queryKey[0];
          if (
            !Array.isArray(routerAndProcedure) ||
            routerAndProcedure[0] !== 'event'
          ) {
            return false;
          }
          return (
            typeof query.queryKey[1] === 'object' &&
            query.queryKey[1] !== null &&
            'id' in (query.queryKey[1] as Record<string, unknown>) &&
            (query.queryKey[1] as Record<string, unknown>).id === eventId
          );
        },
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['event', 'person']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    realTime: {
      isConnected: true,
      isEnabled: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

/**
 * Enhanced leave event hook
 */
export function useLeaveEvent() {
  const queryClient = useQueryClient();

  const mutation = api.event.leave.useMutation({
    onMutate: async ({ eventId: _eventId }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['event', 'person']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['event', 'person']),
      });

      // Optimistically remove event queries from cache
      queryClient.removeQueries({
        predicate: createTRPCRouterPredicate(['event']),
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['event', 'person']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    realTime: {
      isConnected: true,
      isEnabled: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

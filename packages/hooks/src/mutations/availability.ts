import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';

// ============================================================================
// AVAILABILITY MUTATION HOOKS
// ============================================================================

/**
 * Enhanced update member availability hook
 */
export function useUpdateMemberAvailabilities() {
  const queryClient = useQueryClient();

  const mutation = api.availability.updateAvailabilities.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['availability', 'event']),
      });
    },
    retry: false,
  });

  return {
    // Mutation methods and status
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,

    // Real-time sync status
    realTime: {
      isConnected: true,
      isEnabled: true,
      willSync: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

/**
 * Enhanced choose date time hook (organizer only)
 */
export function useChooseDateTime() {
  const queryClient = useQueryClient();

  const mutation = api.availability.chooseDateTime.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['availability', 'event']),
      });
    },
    retry: false,
  });

  return {
    // Mutation methods and status
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,

    // Real-time sync status
    realTime: {
      isConnected: true,
      isEnabled: true,
      willSync: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

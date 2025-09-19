import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';

// ============================================================================
// SETTINGS MUTATION HOOKS
// ============================================================================

/**
 * Enhanced update user settings hook
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  const mutation = api.settings.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'settings',
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
      isEnabled: false, // Settings are user-specific
      willSync: false,
      hasOptimisticUpdates: false,
      willSyncWithOthers: false,
    },
  };
}

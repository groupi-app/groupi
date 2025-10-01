import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import type {
  ResultTuple,
  NotificationMethodSettingsDTO,
  UpdateUserSettingsParams,
  NotFoundError,
  DatabaseError,
  ValidationError,
} from '@groupi/schema';

// ============================================================================
// TYPES
// ============================================================================

// Union types for specific error handling
type SettingsMutationError = ValidationError | DatabaseError | NotFoundError;

// Note: Input types now imported from @groupi/schema params
// - UpdateUserSettingsInput -> UpdateUserSettingsParams

// ============================================================================
// SETTINGS MUTATION HOOKS
// ============================================================================

/**
 * Enhanced update user settings hook with clean mutation function
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  const mutation = api.settings.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['settings']),
      });
    },
    retry: false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Clean mutation function for components
  const updateSettings = useCallback(
    async (
      input: UpdateUserSettingsParams,
      callbacks?: {
        onSuccess?: (settings: NotificationMethodSettingsDTO[]) => void;
        onError?: (error: SettingsMutationError) => void;
      }
    ): Promise<
      ResultTuple<SettingsMutationError, NotificationMethodSettingsDTO[]>
    > => {
      try {
        const result = await mutation.mutateAsync(input);
        const [error, settings] = result;

        if (error) {
          callbacks?.onError?.(error as SettingsMutationError);
          return [error as SettingsMutationError, undefined];
        }

        callbacks?.onSuccess?.(settings);
        return [null, settings];
      } catch (error) {
        const mutationError = error as SettingsMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    updateSettings,

    // Mutation status
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
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

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import type {
  ResultTuple,
  EventInviteDTO,
  CreateInviteParams,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
} from '@groupi/schema';

// ============================================================================
// TYPES
// ============================================================================

type InviteMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError;

// Note: Input types now imported from @groupi/schema params
// - CreateInviteInput -> CreateInviteParams

// ============================================================================
// INVITE MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create invite hook with clean mutation function
 */
export function useCreateInvite() {
  const queryClient = useQueryClient();

  const mutation = api.invite.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['invite']),
      });
    },
    retry: false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Clean mutation function for components
  const createInvite = useCallback(
    async (
      input: CreateInviteParams,
      callbacks?: {
        onSuccess?: (invite: EventInviteDTO) => void;
        onError?: (error: InviteMutationError) => void;
      }
    ): Promise<ResultTuple<InviteMutationError, EventInviteDTO>> => {
      try {
        const result = await mutation.mutateAsync(input);
        const [error, invite] = result;

        if (error) {
          callbacks?.onError?.(error as InviteMutationError);
          return [error as InviteMutationError, undefined];
        }

        callbacks?.onSuccess?.(invite);
        return [null, invite];
      } catch (error) {
        const mutationError = error as InviteMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    createInvite,

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
 * Hook for deleting invites with tuple handling
 */
export function useDeleteInvite() {
  const queryClient = useQueryClient();

  const mutation = api.invite.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['invite', 'event']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: async (inviteId: string) => {
      const result = await mutation.mutateAsync({ inviteId });
      return result; // Returns [error, result] tuple
    },
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

// Note: useDeleteManyInvites removed - deleteMany endpoint no longer exists
// Use useDeleteInvite for individual invite deletion

/**
 * Hook for accepting invites with tuple handling
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  const mutation = api.invite.accept.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['invite', 'event', 'person']),
      });
    },
    retry: false,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: async (data: { inviteId: string; personId: string }) => {
      const result = await mutation.mutateAsync(data);
      return result; // Returns [error, result] tuple
    },
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

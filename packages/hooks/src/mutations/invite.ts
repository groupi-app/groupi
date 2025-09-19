import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';

// ============================================================================
// INVITE MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create invite hook
 */
export function useCreateInvite() {
  const queryClient = useQueryClient();

  const mutation = api.invite.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'invite',
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
    realTime: { isConnected: true, isEnabled: true, willSync: true },
  };
}

/**
 * Hook for deleting invites with tuple handling
 */
export function useDeleteInvite() {
  const utils = api.useContext();

  const mutation = api.invite.delete.useMutation({
    onSuccess: (result: any) => {
      const [error, _deleteResult] = result;

      if (!error) {
        // Invalidate relevant caches
        utils.event.getById.invalidate();
        utils.event.getPageData.invalidate();
      }
    },
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

/**
 * Hook for deleting multiple invites
 */
export function useDeleteManyInvites() {
  const utils = api.useContext();

  const mutation = api.invite.deleteMany.useMutation({
    onSuccess: (result: any) => {
      const [error, _deleteResult] = result;

      if (!error) {
        // Invalidate relevant caches
        utils.event.getById.invalidate();
        utils.event.getPageData.invalidate();
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for accepting invites with tuple handling
 */
export function useAcceptInvite() {
  const utils = api.useContext();

  const mutation = api.invite.accept.useMutation({
    onSuccess: (result: any) => {
      const [error, _acceptResult] = result;

      if (!error) {
        // Invalidate relevant caches
        utils.person.getCurrent.invalidate(); // Refresh user's event list
        utils.event.getById.invalidate();
        utils.event.getPageData.invalidate();
      }
    },
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

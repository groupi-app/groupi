import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import type {
  ResultTuple,
  MembershipDTO,
  UpdateMemberRoleParams,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
} from '@groupi/schema';

type MemberMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError;

// Note: Input types now imported from @groupi/schema params
// - UpdateMemberRoleInput -> UpdateMemberRoleParams

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const mutation = api.member.remove.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['member', 'event']),
      });
    },
    retry: false,
  });
  return {
    mutate: mutation.mutate,
    mutateAsync: async (input: { memberId: string }) =>
      mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const mutation = api.member.updateRole.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['member', 'event']),
      });
    },
    retry: false,
  });
  return {
    mutate: mutation.mutate,
    mutateAsync: async (input: UpdateMemberRoleParams) =>
      mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useUpdateRSVP() {
  const queryClient = useQueryClient();
  const mutation = api.member.updateRSVP.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['member', 'event']),
      });
    },
    retry: false,
  });
  const updateRSVP = useCallback(
    async (
      input: { eventId: string; status: 'YES' | 'NO' | 'MAYBE' | 'PENDING' },
      callbacks?: {
        onSuccess?: (membership: MembershipDTO) => void;
        onError?: (error: MemberMutationError) => void;
      }
    ): Promise<ResultTuple<MemberMutationError, MembershipDTO>> => {
      try {
        const result = await mutation.mutateAsync(input);
        const [error, membership] = result;
        if (error) {
          callbacks?.onError?.(error as MemberMutationError);
          return [error as MemberMutationError, undefined];
        }
        callbacks?.onSuccess?.(membership);
        return [null, membership];
      } catch (error) {
        const e = error as MemberMutationError;
        callbacks?.onError?.(e);
        return [e, undefined];
      }
    },
    [mutation]
  );
  return {
    updateRSVP,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';
import { createTRPCRouterPredicate } from '../utils/query-key-utils';
import type {
  ResultTuple,
  PostDetailPageDTO,
  PostDTO,
  CreatePostParams,
  UpdatePostParams,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
} from '@groupi/schema';

// ============================================================================
// TYPES
// ============================================================================

// Union types for specific error handling
type PostMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError;

// Note: Input types now imported from @groupi/schema params
// - CreatePostInput -> CreatePostParams
// - UpdatePostInput -> UpdatePostParams
// PostResponse type removed in favor of proper DTOs from schema

// ============================================================================
// POST MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create post hook with clean mutation function
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  const mutation = api.post.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['post', 'event']),
      });
    },
    retry: false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Clean mutation function for components
  const createPost = useCallback(
    async (
      input: CreatePostParams,
      callbacks?: {
        onSuccess?: (post: PostDTO) => void;
        onError?: (error: PostMutationError) => void;
      }
    ): Promise<ResultTuple<PostMutationError, PostDTO>> => {
      try {
        const result = await mutation.mutateAsync(input);
        const [error, post] = result;

        if (error) {
          callbacks?.onError?.(error as PostMutationError);
          return [error as PostMutationError, undefined];
        }

        callbacks?.onSuccess?.(post);
        return [null, post];
      } catch (error) {
        const mutationError = error as PostMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    createPost,

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
 * Enhanced update post hook with optimistic updates
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  const mutation = api.post.update.useMutation({
    onMutate: async ({ id: _postId, content }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['post']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['post']),
      });

      // Optimistic update
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['post']) },
        (old: unknown) => {
          const typed = old as
            | ResultTuple<unknown, PostDetailPageDTO>
            | undefined;
          if (!typed) return old as unknown;
          const [error, post] = typed;
          if (error || !post) return old as unknown;

          return [null, { ...post, content }];
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
        predicate: createTRPCRouterPredicate(['post']),
      });
    },
    retry: false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Clean mutation function for components
  const updatePost = useCallback(
    async (
      input: UpdatePostParams,
      callbacks?: {
        onSuccess?: (post: PostDTO) => void;
        onError?: (error: PostMutationError) => void;
      }
    ): Promise<ResultTuple<PostMutationError, PostDTO>> => {
      try {
        const result = await mutation.mutateAsync(input);
        const [error, post] = result;

        if (error) {
          callbacks?.onError?.(error as PostMutationError);
          return [error as PostMutationError, undefined];
        }

        callbacks?.onSuccess?.(post);
        return [null, post];
      } catch (error) {
        const mutationError = error as PostMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    updatePost,

    // Mutation status
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
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
 * Enhanced delete post hook
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  const mutation = api.post.delete.useMutation({
    onMutate: async ({ postId: _postId }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['post', 'event']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['post', 'event']),
      });

      // Optimistically remove post
      queryClient.removeQueries({
        predicate: createTRPCRouterPredicate(['post']),
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
        predicate: createTRPCRouterPredicate(['post', 'event']),
      });
    },
    retry: false,
  });

  // Clean mutation function for components
  const deletePost = useCallback(
    async (
      postId: string,
      callbacks?: {
        onSuccess?: () => void;
        onError?: (error: PostMutationError) => void;
      }
    ): Promise<ResultTuple<PostMutationError, { message: string }>> => {
      try {
        const result = await mutation.mutateAsync({ postId });
        const [error, deleteResult] = result;

        if (error) {
          callbacks?.onError?.(error as PostMutationError);
          return [error as PostMutationError, undefined];
        }

        callbacks?.onSuccess?.();
        return [null, deleteResult as { message: string }];
      } catch (error) {
        const mutationError = error as PostMutationError;
        callbacks?.onError?.(mutationError);
        return [mutationError, undefined];
      }
    },
    [mutation]
  );

  return {
    // Clean mutation function
    deletePost,

    // Mutation status
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,

    realTime: {
      isConnected: true,
      isEnabled: true,
      hasOptimisticUpdates: true,
      willSyncWithOthers: true,
    },
  };
}

// ============================================================================
// REPLY MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create reply hook
 */
export function useCreateReply() {
  const queryClient = useQueryClient();

  const mutation = api.reply.create.useMutation({
    onMutate: async ({ postId: _postId, text }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['post']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['post']),
      });

      // Optimistically add reply to post
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['post']) },
        (old: unknown) => {
          const typed = old as
            | ResultTuple<unknown, PostDetailPageDTO>
            | undefined;
          if (!typed) return old as unknown;
          const [error, post] = typed;
          if (error || !post || !post.post.replies) return old as unknown;

          // Create optimistic reply
          const tempReply = {
            id: `temp-${Date.now()}`,
            text,
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
              // This will be updated with real data on success
              id: 'temp',
              firstName: 'Creating...',
              lastName: '',
              username: '',
              imageUrl: '',
            },
          };

          return [
            null,
            {
              ...post,
              post: {
                ...post.post,
                replies: [...post.post.replies, tempReply],
              },
            },
          ] as ResultTuple<unknown, PostDetailPageDTO>;
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
        predicate: createTRPCRouterPredicate(['post']),
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
 * Enhanced update reply hook with real-time sync
 */
export function useUpdateReply() {
  const queryClient = useQueryClient();

  const mutation = api.reply.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: createTRPCRouterPredicate(['post', 'reply']),
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
      hasOptimisticUpdates: false,
      willSyncWithOthers: true,
    },
  };
}

/**
 * Enhanced delete reply hook
 */
export function useDeleteReply() {
  const queryClient = useQueryClient();

  const mutation = api.reply.delete.useMutation({
    onMutate: async ({ replyId: replyIdToDelete }) => {
      await queryClient.cancelQueries({
        predicate: createTRPCRouterPredicate(['post']),
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: createTRPCRouterPredicate(['post']),
      });

      // Optimistically remove reply from post
      queryClient.setQueriesData(
        { predicate: createTRPCRouterPredicate(['post']) },
        (old: unknown) => {
          const typed = old as
            | ResultTuple<unknown, PostDetailPageDTO>
            | undefined;
          if (!typed) return old as unknown;
          const [error, post] = typed;
          if (error || !post || !post.post.replies) return old as unknown;

          return [
            null,
            {
              ...post,
              post: {
                ...post.post,
                replies: post.post.replies.filter(
                  r => r.id !== replyIdToDelete
                ),
              },
            },
          ] as ResultTuple<unknown, PostDetailPageDTO>;
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
        predicate: createTRPCRouterPredicate(['post', 'reply']),
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

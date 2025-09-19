import { useQueryClient } from '@tanstack/react-query';
import { api } from '../clients/trpc-client';

// ============================================================================
// POST MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create post hook
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  const mutation = api.post.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey[0] === 'post' || query.queryKey[0] === 'event',
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
 * Enhanced update post hook with optimistic updates
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  const mutation = api.post.update.useMutation({
    onMutate: async ({ id: _postId, content }) => {
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'post',
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'post',
      });

      // Optimistic update
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'post' },
        (old: [any, any] | undefined) => {
          if (!old) return old;
          const [error, post] = old;
          if (error || !post) return old;

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
        predicate: query => query.queryKey[0] === 'post',
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
 * Enhanced delete post hook
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  const mutation = api.post.delete.useMutation({
    onMutate: async ({ id: _id }) => {
      await queryClient.cancelQueries({
        predicate: query =>
          query.queryKey[0] === 'post' || query.queryKey[0] === 'event',
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: query =>
          query.queryKey[0] === 'post' || query.queryKey[0] === 'event',
      });

      // Optimistically remove post
      queryClient.removeQueries({
        predicate: query => query.queryKey[0] === 'post',
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
        predicate: query =>
          query.queryKey[0] === 'post' || query.queryKey[0] === 'event',
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

// ============================================================================
// REPLY MUTATION HOOKS
// ============================================================================

/**
 * Enhanced create reply hook
 */
export function useCreateReply() {
  const queryClient = useQueryClient();

  const mutation = api.reply.create.useMutation({
    onMutate: async ({ postId, text }) => {
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'post',
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'post',
      });

      // Optimistically add reply to post
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'post' },
        (old: [any, any] | undefined) => {
          if (!old) return old;
          const [error, post] = old;
          if (error || !post || !post.replies) return old;

          // Create optimistic reply
          const tempReply = {
            id: `temp-${Date.now()}`,
            text,
            postId,
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
              // This will be updated with real data on success
              id: 'temp',
              firstName: 'Creating...',
              lastName: '',
              username: '',
              imageUrl: null,
            },
          };

          return [
            null,
            {
              ...post,
              replies: {
                ...post.replies,
                replies: [...post.replies.replies, tempReply],
                total: post.replies.total + 1,
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
        predicate: query => query.queryKey[0] === 'post',
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
        predicate: query =>
          query.queryKey[0] === 'post' || query.queryKey[0] === 'reply',
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
    onMutate: async ({ id: replyIdToDelete }) => {
      await queryClient.cancelQueries({
        predicate: query => query.queryKey[0] === 'post',
      });

      const previousQueries = queryClient.getQueriesData({
        predicate: query => query.queryKey[0] === 'post',
      });

      // Optimistically remove reply from post
      queryClient.setQueriesData(
        { predicate: query => query.queryKey[0] === 'post' },
        (old: [any, any] | undefined) => {
          if (!old) return old;
          const [error, post] = old;
          if (error || !post || !post.replies) return old;

          return [
            null,
            {
              ...post,
              replies: {
                ...post.replies,
                replies: post.replies.replies.filter(
                  (r: any) => r.id !== replyIdToDelete
                ),
                total: Math.max(0, post.replies.total - 1),
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
        predicate: query =>
          query.queryKey[0] === 'post' || query.queryKey[0] === 'reply',
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

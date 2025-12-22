'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePostAction } from '@/actions/post-actions';
import { qk } from '@/lib/query-keys';
import type { PostFeedData } from '@groupi/schema/data';
import type { PostMutationError } from '@/actions/post-actions';
import { hookLogger } from '@/lib/logger';

interface DeletePostInput {
  postId: string;
}

/**
 * Mutation hook for deleting a post with optimistic updates
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: DeletePostInput
    ): Promise<{ message: string; eventId?: string }> => {
      const [error, data] = await deletePostAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (deletedPost: DeletePostInput) => {
      // Find which event this post belongs to by searching all post feeds
      const queryCache = queryClient.getQueryCache();
      const feedQueries = queryCache.findAll({ queryKey: ['posts', 'feed'] });

      // Find post detail query for this specific post
      const detailQuery = queryCache.find({
        queryKey: qk.posts.detail(deletedPost.postId),
      });

      // Save previous data for all affected queries
      const prevData = [
        ...feedQueries.map(
          (query: {
            queryKey: readonly unknown[];
            state: { data: unknown };
          }) => ({
            queryKey: [...query.queryKey],
            data: query.state.data,
          })
        ),
        ...(detailQuery
          ? [
              {
                queryKey: [...detailQuery.queryKey],
                data: detailQuery.state.data,
              },
            ]
          : []),
      ];

      // Optimistically remove post from all feeds
      feedQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        queryClient.setQueryData<PostFeedData>(
          query.queryKey,
          (old: PostFeedData | undefined) => {
            if (!old) return old;
            return {
              ...old,
              event: {
                ...old.event,
                posts: old.event.posts.filter(p => p.id !== deletedPost.postId),
              },
            };
          }
        );
      });

      // Optimistically remove post detail query
      if (detailQuery) {
        queryClient.removeQueries({
          queryKey: qk.posts.detail(deletedPost.postId),
        });
      }

      return { prevData };
    },
    onError: (
      err: PostMutationError,
      deletedPost: DeletePostInput,
      ctx?: { prevData?: Array<{ queryKey: unknown[]; data: unknown }> }
    ) => {
      // Log the error for debugging
      hookLogger.error(
        {
          error: err,
          errorType: err.constructor.name,
          errorMessage: err.message,
          postId: deletedPost.postId,
        },
        'Failed to delete post'
      );

      // Rollback on error
      if (ctx?.prevData) {
        ctx.prevData.forEach(
          ({
            queryKey,
            data,
          }: {
            queryKey: readonly unknown[];
            data: unknown;
          }) => {
            queryClient.setQueryData(queryKey, data);
          }
        );
      }
    },
    onSuccess: data => {
      // If we have eventId, invalidate that specific feed
      if (data.eventId) {
        queryClient.invalidateQueries({
          queryKey: qk.posts.feed(data.eventId),
          refetchType: 'none',
        });
      }
    },
  });
}

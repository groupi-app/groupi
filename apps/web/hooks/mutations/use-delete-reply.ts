'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteReplyAction } from '@/actions/reply-actions';
import { qk } from '@/lib/query-keys';
import type { PostDetailPageData } from '@groupi/schema/data';
import type { ReplyMutationError } from '@/actions/reply-actions';

interface DeleteReplyInput {
  replyId: string;
}

/**
 * Mutation hook for deleting a reply with optimistic updates
 */
export function useDeleteReply() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (
      input: DeleteReplyInput
    ): Promise<{ message: string; postId?: string }> => {
      const [error, data] = await deleteReplyAction(input);
      if (error) throw error;
      return data;
    },
    onMutate: async (deletedReply) => {
      // Find which post this reply belongs to by searching all post detail queries
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['posts', 'detail'] });

      // Save previous data for all affected queries
      const prevData = queries.map((query) => ({
        queryKey: [...query.queryKey],
        data: query.state.data,
      }));

      // Optimistically remove reply from all post details
      queries.forEach((query) => {
        queryClient.setQueryData<PostDetailPageData>(
          query.queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              post: {
                ...old.post,
                replies: old.post.replies.filter(
                  (r) => r.id !== deletedReply.replyId
                ),
              },
            };
          }
        );
      });

      return { prevData };
    },
    onError: (_err: ReplyMutationError, _deletedReply, ctx?) => {
      // Rollback on error
      if (ctx?.prevData) {
        ctx.prevData.forEach(({ queryKey, data }: { queryKey: readonly unknown[]; data: unknown }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data) => {
      // If we have postId, invalidate that specific post detail
      if (data.postId) {
        queryClient.invalidateQueries({
          queryKey: qk.posts.detail(data.postId),
          refetchType: 'none',
        });
      }
    },
  });
}


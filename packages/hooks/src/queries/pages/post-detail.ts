import { api } from '../../clients/trpc-client';
import { useSupabaseRealtime } from '../../realtime/use-supabase-realtime';
import { PostDetailPageDTO as PostDetailPageSchema } from '@groupi/schema';
import type { PostDetailPageDTO, ResultTuple } from '@groupi/schema';

// ============================================================================
// POST DETAIL PAGE HOOK
// ============================================================================

/**
 * Hook for PostDetail page (FullPost + Replies)
 * Fetches post with replies and handles real-time updates
 * Includes built-in real-time sync via Supabase
 */
export function usePostDetail(postId: string) {
  // Standard tRPC query
  const query = api.post.getByIdWithReplies.useQuery(
    { postId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for post and reply changes
  useSupabaseRealtime(
    {
      channel: `post-detail-${postId}`,
      changes: [
        {
          table: 'Post',
          filter: `id=eq.${postId}`,
          event: '*',
          handler: ({ newRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['post', 'getDetailData'],
                { input: { id: postId }, type: 'query' },
              ],
              (
                oldValue: ResultTuple<unknown, PostDetailPageDTO> | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;
                const PostPatchSchema =
                  PostDetailPageSchema.shape.post.partial();
                const parsed = PostPatchSchema.safeParse(newRow);
                if (!parsed.success) return oldValue;
                const updated = parsed.data;

                return [
                  null,
                  {
                    ...data,
                    post: { ...data.post, ...updated },
                  },
                ] as ResultTuple<unknown, PostDetailPageDTO>;
              }
            );
          },
        },
        {
          table: 'Reply',
          filter: `postId=eq.${postId}`,
          event: '*',
          handler: ({ queryClient }) => {
            // For replies, it's safer to invalidate and refetch
            queryClient.invalidateQueries({
              queryKey: [
                ['post', 'getDetailData'],
                { input: { id: postId }, type: 'query' },
              ],
            });
          },
        },
        {
          table: 'Person',
          event: '*',
          filter: '*',
          handler: ({ newRow, queryClient }) => {
            queryClient.setQueryData(
              [
                ['post', 'getDetailData'],
                { input: { id: postId }, type: 'query' },
              ],
              (
                oldValue: ResultTuple<unknown, PostDetailPageDTO> | undefined
              ) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;
                const PersonPatchSchema =
                  PostDetailPageSchema.shape.post.shape.author.partial();
                const parsed = PersonPatchSchema.safeParse(newRow);
                if (!parsed.success) return oldValue;
                const personUpdate = parsed.data;
                // Update author data if it matches
                let updated = false;
                const current = data as PostDetailPageDTO;
                const updatedPost = { ...current.post };

                if (current.post.author.id === personUpdate.id) {
                  updatedPost.author = {
                    ...current.post.author,
                    ...personUpdate,
                  };
                  updated = true;
                }

                // Update reply authors
                const updatedReplies = current.post.replies.map(reply => {
                  if (reply.author.id === personUpdate.id) {
                    updated = true;
                    return {
                      ...reply,
                      author: { ...reply.author, ...personUpdate },
                    };
                  }
                  return reply;
                });

                if (updated) {
                  return [
                    null,
                    {
                      ...current,
                      post: { ...updatedPost, replies: updatedReplies },
                    },
                  ] as ResultTuple<unknown, PostDetailPageDTO>;
                }

                return oldValue;
              }
            );
          },
        },
      ],
    },
    [postId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}

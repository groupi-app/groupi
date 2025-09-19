import { api } from '../clients/trpc-client';
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import type { PostDetailResult } from '@groupi/schema';

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
  const query = api.post.getDetailData.useQuery(
    { id: postId },
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
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['post', 'getDetailData'],
                { input: { id: postId }, type: 'query' },
              ],
              (oldValue: PostDetailResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update post data with new values
                return [
                  null,
                  {
                    ...data,
                    post: { ...data.post, ...payload.new },
                  },
                ] as PostDetailResult;
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
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['post', 'getDetailData'],
                { input: { id: postId }, type: 'query' },
              ],
              (oldValue: PostDetailResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update author data if it matches
                let updated = false;
                const updatedPost = { ...data.post };

                if (data.post.author.id === payload.new?.id) {
                  updatedPost.author = { ...data.post.author, ...payload.new };
                  updated = true;
                }

                // Update reply authors
                const updatedReplies = data.post.replies.map(reply => {
                  if (reply.author.id === payload.new?.id) {
                    updated = true;
                    return {
                      ...reply,
                      author: { ...reply.author, ...payload.new },
                    };
                  }
                  return reply;
                });

                if (updated) {
                  return [
                    null,
                    {
                      ...data,
                      post: { ...updatedPost, replies: updatedReplies },
                    },
                  ] as PostDetailResult;
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

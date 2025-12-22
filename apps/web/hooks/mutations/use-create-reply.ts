'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReplyAction } from '@/actions/reply-actions';
import { qk } from '@/lib/query-keys';
import type { PostDetailPageData } from '@groupi/schema/data';
import type { ReplyMutationError } from '@/actions/reply-actions';

interface CreateReplyInput {
  postId: string;
  text: string;
}

interface ReplyDataInput {
  id: string;
  text: string;
  postId: string;
  authorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ReplyData {
  id: string;
  text: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mutation hook for creating a reply with optimistic updates
 */
export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (input: CreateReplyInput): Promise<ReplyData> => {
      const [error, data] = await createReplyAction(input);
      if (error) throw error; // React Query handles thrown errors
      // Convert date strings back to Date objects (server actions serialize dates as strings)
      const inputData = data as ReplyDataInput;
      return {
        ...inputData,
        createdAt:
          inputData.createdAt instanceof Date
            ? inputData.createdAt
            : new Date(inputData.createdAt),
        updatedAt:
          inputData.updatedAt instanceof Date
            ? inputData.updatedAt
            : new Date(inputData.updatedAt),
      };
    },
    onMutate: async newReply => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.posts.detail(newReply.postId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<PostDetailPageData>(
        qk.posts.detail(newReply.postId)
      );

      // Optimistically update cache
      queryClient.setQueryData<PostDetailPageData>(
        qk.posts.detail(newReply.postId),
        old => {
          if (!old) return old;

          // Get current user's personId from userMembership
          const currentUserPersonId = old.userMembership.personId;

          // Try to find an existing reply by the current user to get their author data
          const existingUserReply = old.post.replies.find(
            r => r.author?.id === currentUserPersonId
          );

          // If no existing reply, check if user is the post author
          const authorData = existingUserReply?.author
            ? existingUserReply.author
            : old.post.author.id === currentUserPersonId
              ? {
                  // Post author structure - map to reply author structure (no username)
                  id: old.post.author.id,
                  user: {
                    name: old.post.author.user.name,
                    email: old.post.author.user.email,
                    image: old.post.author.user.image,
                  },
                }
              : {
                  // Fallback: use minimal structure
                  // This will be replaced when real data comes back
                  id: currentUserPersonId,
                  user: {
                    name: null,
                    email: '',
                    image: null,
                  },
                };

          return {
            ...old,
            post: {
              ...old.post,
              replies: [
                ...old.post.replies,
                {
                  id: 'optimistic-' + Date.now(),
                  text: newReply.text,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  author: {
                    id: currentUserPersonId,
                    user: {
                      name: authorData.user?.name || null,
                      email: authorData.user?.email || '',
                      image: authorData.user?.image || null,
                    },
                  },
                  optimistic: true,
                } as PostDetailPageData['post']['replies'][0] & {
                  optimistic: true;
                },
              ],
            },
          };
        }
      );

      return { prev };
    },
    onError: (_err: ReplyMutationError, newReply, ctx?) => {
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(qk.posts.detail(newReply.postId), ctx.prev);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by mutation interface but not used
    onSuccess: (_data, _variables) => {
      // Don't remove optimistic reply or invalidate immediately
      // Pusher will update it with real data, preventing double animation
      // The optimistic reply will be replaced seamlessly when Pusher event arrives
      // For the same user, the optimistic reply stays until Pusher updates it
    },
  });
}

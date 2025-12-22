'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePostAction } from '@/actions/post-actions';
import { qk } from '@/lib/query-keys';
import type { PostFeedData, PostDetailPageData } from '@groupi/schema/data';
import type { PostMutationError } from '@/actions/post-actions';

interface UpdatePostInput {
  id: string;
  title?: string;
  content?: string;
}

interface PostDataInput {
  id: string;
  title: string;
  content: string;
  eventId: string;
  authorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedAt?: Date | string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  eventId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
}

type Post = PostFeedData['event']['posts'][0];

/**
 * Mutation hook for updating a post with optimistic updates
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (input: UpdatePostInput): Promise<PostData> => {
      const [error, data] = await updatePostAction(input);
      if (error) throw error;
      // Convert date strings back to Date objects (server actions serialize dates as strings)
      const inputData = data as PostDataInput;
      const result: PostData = {
        id: inputData.id,
        title: inputData.title,
        content: inputData.content,
        eventId: inputData.eventId,
        authorId: inputData.authorId,
        createdAt:
          inputData.createdAt instanceof Date
            ? inputData.createdAt
            : new Date(inputData.createdAt),
        updatedAt:
          inputData.updatedAt instanceof Date
            ? inputData.updatedAt
            : new Date(inputData.updatedAt),
        ...(inputData.editedAt && {
          editedAt:
            inputData.editedAt instanceof Date
              ? inputData.editedAt
              : new Date(inputData.editedAt),
        }),
      };
      return result;
    },
    onMutate: async (updatedPost: UpdatePostInput) => {
      const queryCache = queryClient.getQueryCache();

      // Find post feed queries
      const feedQueries = queryCache.findAll({ queryKey: ['posts', 'feed'] });

      // Find post detail query for this specific post
      const detailQuery = queryCache.find({
        queryKey: qk.posts.detail(updatedPost.id),
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

      // Optimistically update all post feeds that might contain this post
      feedQueries.forEach((query: { queryKey: readonly unknown[] }) => {
        const eventId = query.queryKey[2] as string;
        queryClient.setQueryData<PostFeedData>(
          qk.posts.feed(eventId),
          (old: PostFeedData | undefined) => {
            if (!old) return old;
            return {
              ...old,
              event: {
                ...old.event,
                posts: old.event.posts.map((p: Post) =>
                  p.id === updatedPost.id
                    ? ({ ...p, ...updatedPost, optimistic: true } as Post & {
                        optimistic: true;
                      })
                    : p
                ),
              },
            };
          }
        );
      });

      // Optimistically update post detail query if it exists
      if (detailQuery) {
        queryClient.setQueryData<PostDetailPageData>(
          qk.posts.detail(updatedPost.id),
          (old: PostDetailPageData | undefined) => {
            if (!old) return old;
            return {
              ...old,
              post: {
                ...old.post,
                title: updatedPost.title ?? old.post.title,
                content: updatedPost.content ?? old.post.content,
                updatedAt: new Date(),
                editedAt: new Date(),
              },
            };
          }
        );
      }

      return { prevData };
    },
    onError: (
      _err: PostMutationError,
      _updatedPost: UpdatePostInput,
      ctx?: { prevData?: Array<{ queryKey: unknown[]; data: unknown }> }
    ) => {
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
    onSuccess: (data: PostData) => {
      // Update with real data
      const eventId = data.eventId;

      // Update post feed
      queryClient.setQueryData<PostFeedData>(
        qk.posts.feed(eventId),
        (old: PostFeedData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            event: {
              ...old.event,
              posts: old.event.posts.map((p: Post) =>
                p.id === data.id ? (data as Post) : p
              ),
            },
          };
        }
      );

      // Update post detail query if it exists
      queryClient.setQueryData<PostDetailPageData>(
        qk.posts.detail(data.id),
        (old: PostDetailPageData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            post: {
              ...old.post,
              title: data.title,
              content: data.content,
              updatedAt: data.updatedAt,
              editedAt: data.editedAt || data.updatedAt,
            },
          };
        }
      );

      // Silently invalidate (Pusher will handle real-time updates)
      queryClient.invalidateQueries({
        queryKey: qk.posts.feed(eventId),
        refetchType: 'none',
      });
      queryClient.invalidateQueries({
        queryKey: qk.posts.detail(data.id),
        refetchType: 'none',
      });
    },
  });
}

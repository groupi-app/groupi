'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPostAction } from '@/actions/post-actions';
import { qk } from '@/lib/query-keys';
import type { PostFeedData, PostDetailPageData, EventHeaderData } from '@groupi/schema/data';
import type { PostMutationError } from '@/actions/post-actions';
import { hookLogger } from '@/lib/logger';

interface CreatePostInput {
  title: string;
  content: string;
  eventId: string;
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
 * Mutation hook for creating a post with optimistic updates
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    // Adapter: Convert tuple to React Query format
    mutationFn: async (input: CreatePostInput): Promise<PostData> => {
      const [error, data] = await createPostAction(input);
      if (error) throw error; // React Query handles thrown errors
      // Convert date strings back to Date objects (server actions serialize dates as strings)
      const inputData = data as PostDataInput;
      return {
        ...inputData,
        createdAt: inputData.createdAt instanceof Date ? inputData.createdAt : new Date(inputData.createdAt),
        updatedAt: inputData.updatedAt instanceof Date ? inputData.updatedAt : new Date(inputData.updatedAt),
        editedAt: inputData.editedAt 
          ? (inputData.editedAt instanceof Date ? inputData.editedAt : new Date(inputData.editedAt))
          : undefined,
      };
    },
    onMutate: async (newPost) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: qk.posts.feed(newPost.eventId),
      });

      // Save previous data for rollback
      const prev = queryClient.getQueryData<PostFeedData>(
        qk.posts.feed(newPost.eventId)
      );

      // Optimistically update cache
      queryClient.setQueryData<PostFeedData>(
        qk.posts.feed(newPost.eventId),
        (old) => {
          if (!old) {
            // If no existing data, skip optimistic update
            // (shouldn't happen in practice, but if it does, we'll wait for server response)
            return old;
          }
          
          // Find the current user's membership to get author data
          const currentUserMembership = old.event.memberships.find(
            (m) => m.id === old.userMembership.id
          );
          
          // If we can't find the membership, skip optimistic update
          if (!currentUserMembership) {
            return old;
          }
          
          return {
            ...old,
            event: {
              ...old.event,
              posts: [
                {
                  ...newPost,
                  id: 'optimistic-' + Date.now(), // Temporary ID
                  authorId: currentUserMembership.personId, // Use current user's personId
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  editedAt: new Date(),
                  author: {
                    id: currentUserMembership.person.id,
                    user: {
                      name: currentUserMembership.person.user.name,
                      email: currentUserMembership.person.user.email,
                      image: currentUserMembership.person.user.image,
                      username: currentUserMembership.person.user.username,
                    },
                  },
                  replies: [],
                  replyCount: 0,
                  optimistic: true,
                } as Post & { optimistic: true },
                ...old.event.posts,
              ],
            },
          };
        }
      );

      return { prev };
    },
    onError: (err: PostMutationError, newPost, ctx?) => {
      // Log the error for debugging
      hookLogger.error(
        {
          error: err,
          errorType: err.constructor.name,
          errorMessage: err.message,
          eventId: newPost.eventId,
          title: newPost.title,
        },
        'Failed to create post'
      );
      
      // Rollback on error
      if (ctx?.prev) {
        queryClient.setQueryData(qk.posts.feed(newPost.eventId), ctx.prev);
      }
    },
    onSuccess: (data, variables) => {
      // Replace optimistic post with real data
      queryClient.setQueryData<PostFeedData>(
        qk.posts.feed(variables.eventId),
        (old) => {
          if (!old) return old;
          
          // Remove optimistic post
          const withoutOptimistic = old.event.posts.filter(
            (p) => !('optimistic' in p && p.optimistic)
          );
          
          // Find the author's membership to get user data
          const authorMembership = old.event.memberships.find(
            (m) => m.personId === data.authorId
          );
          
          // If we can't find the author, skip adding the post
          // (it will be fetched via Pusher or on next refresh)
          if (!authorMembership) {
            return old;
          }
          
          // Transform PostData into PostCardData structure
          const newPost: Post = {
            id: data.id,
            title: data.title,
            content: data.content,
            authorId: data.authorId,
            eventId: data.eventId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            editedAt: data.editedAt ?? data.updatedAt,
            author: {
              id: authorMembership.person.id,
              user: {
                name: authorMembership.person.user.name,
                email: authorMembership.person.user.email,
                image: authorMembership.person.user.image,
                username: authorMembership.person.user.username,
              },
            },
            replies: [], // New post has no replies yet
            replyCount: 0,
          };
          
          return {
            ...old,
            event: {
              ...old.event,
              posts: [newPost, ...withoutOptimistic],
            },
          };
        }
      );

      // Initialize post detail query cache for immediate navigation
      // This ensures real-time subscriptions work when user navigates to the new post
      const feedData = queryClient.getQueryData<PostFeedData>(
        qk.posts.feed(variables.eventId)
      );
      
      // Get event header to access event title (required for PostDetailPageData)
      const eventHeader = queryClient.getQueryData<EventHeaderData>(
        qk.events.header(variables.eventId)
      );
      
      if (feedData && eventHeader) {
        const authorMembership = feedData.event.memberships.find(
          (m) => m.personId === data.authorId
        );
        
        // Find the current user's membership to get personId
        const userMembershipData = feedData.event.memberships.find(
          (m) => m.id === feedData.userMembership.id
        );
        
        if (authorMembership && userMembershipData) {
          // Construct full post structure for detail page
          const fullPost: PostDetailPageData['post'] = {
            id: data.id,
            title: data.title,
            content: data.content,
            authorId: data.authorId,
            eventId: data.eventId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            editedAt: data.editedAt ?? data.updatedAt,
            author: {
              id: authorMembership.person.id,
              user: {
                name: authorMembership.person.user.name,
                email: authorMembership.person.user.email,
                image: authorMembership.person.user.image,
                username: authorMembership.person.user.username,
              },
            },
            replies: [], // New post has no replies yet
            event: {
              id: feedData.event.id,
              title: eventHeader.event.title, // Get title from event header
              chosenDateTime: feedData.event.chosenDateTime,
              memberships: feedData.event.memberships,
            },
          };
          
          // Initialize post detail query cache
          queryClient.setQueryData<PostDetailPageData>(
            qk.posts.detail(data.id),
            {
              post: fullPost,
              userMembership: {
                id: feedData.userMembership.id,
                role: feedData.userMembership.role,
                personId: userMembershipData.personId, // Get personId from membership data
              },
            }
          );
        }
      }

      // Silently invalidate for background sync (no refetch)
      queryClient.invalidateQueries({
        queryKey: qk.posts.feed(variables.eventId),
        refetchType: 'none',
      });
    },
  });
}


'use client';

/* eslint-disable react-hooks/refs -- This file uses intentional caching pattern for visibility optimization */

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useIsActive } from '@/providers/visibility-provider';

// Type for current user data needed for optimistic updates
export interface OptimisticPostUserData {
  personId: Id<'persons'>;
  name?: string;
  email?: string;
  image?: string;
  username?: string;
}

// ===== API REFERENCES =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let postQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let postMutations: any;

function initApi() {
  if (!postQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    postQueries = api.posts?.queries ?? {};
    postMutations = api.posts?.mutations ?? {};
  }
}
initApi();

// ===== POST QUERIES =====

/**
 * Get event post feed with real-time updates.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function useEventPostFeed(eventId: Id<'events'>) {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(
    postQueries.getEventPostFeed,
    isActive ? { eventId } : 'skip'
  );

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Get event post feed with skip support for conditional fetching.
 * Use this when you want to skip the query entirely (e.g., on post detail pages).
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function useEventPostFeedWithSkip(eventId: Id<'events'> | null) {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const shouldSkip = !eventId || !isActive;
  const result = useQuery(
    postQueries.getEventPostFeed,
    shouldSkip ? 'skip' : { eventId }
  );

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Get single post with details.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function usePost(postId: Id<'posts'>) {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(postQueries.getPost, isActive ? { postId } : 'skip');

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Get post detail page data (post + replies).
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function usePostDetail(postId: Id<'posts'>) {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(
    postQueries.getPostDetail,
    isActive ? { postId } : 'skip'
  );

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Get post detail with skip support for conditional fetching.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function usePostDetailWithSkip(postId: Id<'posts'> | null) {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const shouldSkip = !postId || !isActive;
  const result = useQuery(
    postQueries.getPostDetail,
    shouldSkip ? 'skip' : { postId }
  );

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

/**
 * Paginated post feed hook - uses standard query.
 * Note: The query handles pagination internally via limit/cursor.
 * Pauses subscription when tab is hidden to reduce bandwidth.
 */
export function usePaginatedEventPosts(eventId: Id<'events'>) {
  const isActive = useIsActive();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cachedRef = useRef<any>(undefined);

  const result = useQuery(
    postQueries.getEventPostFeed,
    isActive ? { eventId } : 'skip'
  );

  // Cache the result when we get fresh data
  if (result !== undefined) {
    cachedRef.current = result;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  if (result === undefined && cachedRef.current !== undefined) {
    return cachedRef.current;
  }

  return result;
}

// ===== POST MUTATIONS =====

/**
 * Create post with optimistic updates
 * Pass currentUser for instant optimistic UI updates
 */
export function useCreatePost(currentUser?: OptimisticPostUserData) {
  const baseMutation = useMutation(postMutations.createPost);
  const { toast } = useToast();

  // Create mutation with optimistic update if user data is provided
  const createPost = useMemo(() => {
    if (!currentUser) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(postQueries.getEventPostFeed, {
        eventId: args.eventId,
      });

      if (currentData === undefined || !currentData.event) {
        return;
      }

      // Create optimistic post
      // eslint-disable-next-line react-hooks/purity -- Date.now() is called in mutation callback, not during render
      const now = Date.now();
      const optimisticPost = {
        _id: `optimistic_${now}` as unknown as Id<'posts'>,
        _creationTime: now,
        eventId: args.eventId,
        title: args.title,
        content: args.content,
        authorId: currentUser.personId,
        editedAt: undefined,
        author: {
          person: {
            _id: currentUser.personId,
            user: {
              _id: `optimistic_user`,
              name: currentUser.name,
              email: currentUser.email || '',
              image: currentUser.image,
              username: currentUser.username,
            },
          },
          user: {
            _id: `optimistic_user`,
            name: currentUser.name,
            email: currentUser.email || '',
            image: currentUser.image,
            username: currentUser.username,
          },
        },
        replyCount: 0,
      };

      // Add optimistic post to the beginning of the feed
      localStore.setQuery(
        postQueries.getEventPostFeed,
        { eventId: args.eventId },
        {
          ...currentData,
          event: {
            ...currentData.event,
            posts: [optimisticPost, ...(currentData.event.posts || [])],
          },
        }
      );
    });
  }, [baseMutation, currentUser]);

  return useCallback(
    async (data: { eventId: Id<'events'>; title: string; content: string }) => {
      try {
        const result = await createPost({
          eventId: data.eventId,
          title: data.title,
          content: data.content,
        });

        // No success toast - instant appearance is feedback enough
        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create post. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [createPost, toast]
  );
}

/**
 * Update post with optimistic updates
 */
export function useUpdatePost(eventId?: Id<'events'>) {
  const baseMutation = useMutation(postMutations.updatePost);
  const { toast } = useToast();

  // Create mutation with optimistic update if eventId is provided
  const updatePost = useMemo(() => {
    if (!eventId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      // eslint-disable-next-line react-hooks/purity -- Date.now() is called in mutation callback, not during render
      const editedAt = Date.now();

      // Update in the post feed
      const feedData = localStore.getQuery(postQueries.getEventPostFeed, {
        eventId,
      });

      if (feedData?.event?.posts) {
        const updatedPosts = feedData.event.posts.map(
          (post: { _id: Id<'posts'>; title: string; content: string }) =>
            post._id === args.postId
              ? { ...post, title: args.title, content: args.content, editedAt }
              : post
        );

        localStore.setQuery(
          postQueries.getEventPostFeed,
          { eventId },
          {
            ...feedData,
            event: {
              ...feedData.event,
              posts: updatedPosts,
            },
          }
        );
      }

      // Update in the post detail view
      const detailData = localStore.getQuery(postQueries.getPostDetail, {
        postId: args.postId,
      });

      if (detailData?.post) {
        localStore.setQuery(
          postQueries.getPostDetail,
          { postId: args.postId },
          {
            ...detailData,
            post: {
              ...detailData.post,
              title: args.title,
              content: args.content,
              editedAt,
            },
          }
        );
      }
    });
  }, [baseMutation, eventId]);

  return useCallback(
    async (data: { postId: Id<'posts'>; title: string; content: string }) => {
      try {
        const result = await updatePost({
          postId: data.postId,
          title: data.title,
          content: data.content,
        });

        // No success toast - instant update is feedback enough
        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update post. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updatePost, toast]
  );
}

/**
 * Delete post with optimistic updates
 */
export function useDeletePost(eventId?: Id<'events'>) {
  const baseMutation = useMutation(postMutations.deletePost);
  const { toast } = useToast();

  // Create mutation with optimistic update if eventId is provided
  const deletePost = useMemo(() => {
    if (!eventId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const feedData = localStore.getQuery(postQueries.getEventPostFeed, {
        eventId,
      });

      if (feedData?.event?.posts) {
        const filteredPosts = feedData.event.posts.filter(
          (post: { _id: Id<'posts'> }) => post._id !== args.postId
        );

        localStore.setQuery(
          postQueries.getEventPostFeed,
          { eventId },
          {
            ...feedData,
            event: {
              ...feedData.event,
              posts: filteredPosts,
            },
          }
        );
      }
    });
  }, [baseMutation, eventId]);

  return useCallback(
    async (postId: Id<'posts'>) => {
      try {
        const result = await deletePost({ postId });

        // No success toast - instant removal is feedback enough
        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete post. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [deletePost, toast]
  );
}

// ===== COMBINED HOOKS =====

/**
 * Complete post management for an event with optimistic updates
 * Pass currentUser for instant optimistic UI updates
 */
export function useEventPosts(
  eventId: Id<'events'>,
  currentUser?: OptimisticPostUserData
) {
  const feedData = useEventPostFeed(eventId);
  const posts = feedData?.event?.posts ?? [];

  const createPost = useCreatePost(currentUser);
  const updatePost = useUpdatePost(eventId);
  const deletePost = useDeletePost(eventId);

  const createPostWithEventId = useCallback(
    async (data: { title: string; content: string }) => {
      return createPost({ eventId, ...data });
    },
    [eventId, createPost]
  );

  return {
    posts,
    event: feedData?.event,
    userMembership: feedData?.userMembership,
    createPost: createPostWithEventId,
    updatePost,
    deletePost,
    isLoading: feedData === undefined,
  };
}

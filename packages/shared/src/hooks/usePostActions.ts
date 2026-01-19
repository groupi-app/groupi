/**
 * Platform-agnostic post action hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 * UI feedback (toasts, alerts) handled separately per platform
 */

import { useMutation } from 'convex/react';
import { useCallback } from 'react';
import type { ConvexApi, ConvexId } from './types';

/**
 * Post action hooks factory - accepts api and returns post action hooks
 */
export function createPostActionHooks(api: ConvexApi) {
  /**
   * Create a new post
   * Works on web and mobile - no UI feedback included
   */
  function useCreatePost() {
    return useMutation(api.posts.mutations.createPost);
  }

  /**
   * Update post content
   * Works on web and mobile - no UI feedback included
   */
  function useUpdatePost() {
    return useMutation(api.posts.mutations.updatePost);
  }

  /**
   * Delete a post
   * Works on web and mobile - no UI feedback included
   */
  function useDeletePost() {
    return useMutation(api.posts.mutations.deletePost);
  }

  /**
   * Create a reply to a post
   * Works on web and mobile - no UI feedback included
   */
  function useCreateReply() {
    return useMutation(api.posts.mutations.createReply);
  }

  /**
   * Update reply content
   * Works on web and mobile - no UI feedback included
   */
  function useUpdateReply() {
    return useMutation(api.posts.mutations.updateReply);
  }

  /**
   * Delete a reply
   * Works on web and mobile - no UI feedback included
   */
  function useDeleteReply() {
    return useMutation(api.posts.mutations.deleteReply);
  }

  /**
   * Post actions bound to specific post ID
   * Works on web and mobile - UI feedback handled separately
   */
  function usePostActions(postId: ConvexId<'posts'>) {
    const updatePost = useUpdatePost();
    const deletePost = useDeletePost();
    const createReply = useCreateReply();

    // Bound actions with postId pre-filled
    const updatePostForId = useCallback(
      async (data: { title?: string; content?: string }) => {
        return updatePost({ postId, ...data });
      },
      [postId, updatePost]
    );

    const deletePostForId = useCallback(async () => {
      return deletePost({ postId });
    }, [postId, deletePost]);

    const createReplyForId = useCallback(
      async (data: { content: string }) => {
        return createReply({ postId, ...data });
      },
      [postId, createReply]
    );

    return {
      updatePost: updatePostForId,
      deletePost: deletePostForId,
      createReply: createReplyForId,
    };
  }

  /**
   * Reply actions bound to specific reply ID
   * Works on web and mobile - UI feedback handled separately
   */
  function useReplyActions(replyId: ConvexId<'replies'>) {
    const updateReply = useUpdateReply();
    const deleteReply = useDeleteReply();

    // Bound actions with replyId pre-filled
    const updateReplyForId = useCallback(
      async (data: { content: string }) => {
        return updateReply({ replyId, ...data });
      },
      [replyId, updateReply]
    );

    const deleteReplyForId = useCallback(async () => {
      return deleteReply({ replyId });
    }, [replyId, deleteReply]);

    return {
      updateReply: updateReplyForId,
      deleteReply: deleteReplyForId,
    };
  }

  /**
   * Event post actions for creating posts within an event
   * Works on web and mobile
   */
  function useEventPostActions(eventId: ConvexId<'events'>) {
    const createPost = useCreatePost();

    const createEventPost = useCallback(
      async (data: { title: string; content: string }) => {
        return createPost({ eventId, ...data });
      },
      [eventId, createPost]
    );

    return {
      createPost: createEventPost,
    };
  }

  /**
   * Complete post management for a specific post
   * Combines data and actions - works on web and mobile
   */
  function usePostManagement(postId: ConvexId<'posts'>) {
    const actions = usePostActions(postId);

    return {
      // Actions (no UI feedback - handle in platform layer)
      ...actions,
    };
  }

  return {
    useCreatePost,
    useUpdatePost,
    useDeletePost,
    useCreateReply,
    useUpdateReply,
    useDeleteReply,
    usePostActions,
    useReplyActions,
    useEventPostActions,
    usePostManagement,
  };
}

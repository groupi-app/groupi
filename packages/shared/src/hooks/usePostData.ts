/**
 * Platform-agnostic post data hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 */

import { useQuery } from 'convex/react';
import type { ConvexApi, ConvexId } from './types';

/**
 * Post data hooks factory - accepts api and returns post data hooks
 */
export function createPostDataHooks(api: ConvexApi) {
  /**
   * Get detailed post data with replies
   * Works on web and mobile
   */
  function usePostDetail(postId: ConvexId<'posts'>) {
    return useQuery(api.posts.queries.getPostDetail, { postId });
  }

  /**
   * Get post feed for a specific event
   * Works on web and mobile
   */
  function useEventPostFeed(eventId: ConvexId<'events'>) {
    return useQuery(api.posts.queries.getEventPostFeed, { eventId });
  }

  /**
   * Get replies for a specific post
   * Works on web and mobile
   */
  function usePostReplies(postId: ConvexId<'posts'>) {
    return useQuery(api.posts.queries.getPostReplies, { postId });
  }

  /**
   * Get single post data
   * Works on web and mobile
   */
  function usePost(postId: ConvexId<'posts'>) {
    return useQuery(api.posts.queries.getPost, { postId });
  }

  /**
   * Check if user can manage a specific post
   * Works on web and mobile
   */
  function useCanManagePost(postId: ConvexId<'posts'>) {
    const postData = usePostDetail(postId);

    return {
      canEdit:
        postData?.post &&
        postData?.userMembership &&
        (postData.post.authorId === postData.userMembership.person._id ||
          postData.userMembership.role === 'ORGANIZER' ||
          postData.userMembership.role === 'MODERATOR'),
      canDelete:
        postData?.post &&
        postData?.userMembership &&
        (postData.post.authorId === postData.userMembership.person._id ||
          postData.userMembership.role === 'ORGANIZER' ||
          postData.userMembership.role === 'MODERATOR'),
      isAuthor:
        postData?.post &&
        postData?.userMembership &&
        postData.post.authorId === postData.userMembership.person._id,
      role: postData?.userMembership?.role,
    };
  }

  /**
   * Get loading states for post-related operations
   * Works on web and mobile
   */
  function usePostLoadingStates(postId: ConvexId<'posts'>) {
    const postDetail = usePostDetail(postId);
    const postReplies = usePostReplies(postId);

    return {
      isLoadingPost: postDetail === undefined,
      isLoadingReplies: postReplies === undefined,
      isLoadingAny: postDetail === undefined || postReplies === undefined,
      hasPostData: postDetail !== undefined,
      hasRepliesData: postReplies !== undefined,
    };
  }

  return {
    usePostDetail,
    useEventPostFeed,
    usePostReplies,
    usePost,
    useCanManagePost,
    usePostLoadingStates,
  };
}

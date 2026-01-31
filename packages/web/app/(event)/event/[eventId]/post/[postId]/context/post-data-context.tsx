'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { usePostDetail } from '@/hooks/convex/use-posts';
import { useRepliesByPost } from '@/hooks/convex/use-replies';

// ===== Types =====

// Infer types from hook return values
type PostDetailData = ReturnType<typeof usePostDetail>;
type RepliesData = ReturnType<typeof useRepliesByPost>;

interface PostDataContextValue {
  postId: string;
  // Raw data from hooks (undefined = loading, null = not found)
  postDetailData: PostDetailData;
  repliesData: RepliesData;
  // Computed loading states
  isLoading: boolean;
  isPostLoading: boolean;
  isRepliesLoading: boolean;
}

// ===== Context =====

const PostDataContext = createContext<PostDataContextValue | null>(null);

// ===== Provider =====

interface PostDataProviderProps {
  postId: string;
  children: ReactNode;
}

/**
 * Provides post-related data to child components via context.
 * Data is fetched once at the layout level and shared across all child pages.
 *
 * This prevents:
 * - Skeleton flashes when navigating to/from post pages
 * - Duplicate queries for the same post data
 */
export function PostDataProvider({ postId, children }: PostDataProviderProps) {
  const postIdTyped = postId as Id<'posts'>;

  // Fetch post-related data at the provider level
  const postDetailData = usePostDetail(postIdTyped);
  const repliesData = useRepliesByPost(postIdTyped);

  // Compute loading states
  const isPostLoading = postDetailData === undefined;
  const isRepliesLoading = repliesData === undefined;
  const isLoading = isPostLoading;

  const value = useMemo<PostDataContextValue>(
    () => ({
      postId,
      postDetailData,
      repliesData,
      isLoading,
      isPostLoading,
      isRepliesLoading,
    }),
    [
      postId,
      postDetailData,
      repliesData,
      isLoading,
      isPostLoading,
      isRepliesLoading,
    ]
  );

  return (
    <PostDataContext.Provider value={value}>
      {children}
    </PostDataContext.Provider>
  );
}

// ===== Consumer Hooks =====

/**
 * Access the full post data context.
 * Must be used within a PostDataProvider.
 */
export function usePostData() {
  const context = useContext(PostDataContext);
  if (!context) {
    throw new Error('usePostData must be used within a PostDataProvider');
  }
  return context;
}

/**
 * Access post detail data from context.
 * Drop-in replacement for usePostDetail.
 */
export function usePostDetailFromContext() {
  const { postDetailData, isPostLoading } = usePostData();
  return { data: postDetailData, isLoading: isPostLoading };
}

/**
 * Access replies data from context.
 * Drop-in replacement for useReplies.
 */
export function useRepliesFromContext() {
  const { repliesData, isRepliesLoading } = usePostData();
  return { data: repliesData, isLoading: isRepliesLoading };
}

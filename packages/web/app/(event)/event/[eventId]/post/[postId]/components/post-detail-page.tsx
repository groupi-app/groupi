'use client';

import { FullPost } from './full-post';
import { PostStickyHeader } from './post-sticky-header';
import { useRef, useEffect } from 'react';
import { useMarkPostNotificationsAsRead } from '@/hooks/convex/use-replies';
import { useEventData } from '../../../context';
import { Id } from '@/convex/_generated/dataModel';
import { PostDetailSkeleton } from '@/components/skeletons';

export function PostDetailPage({ postId }: { postId: string }) {
  const postRef = useRef<HTMLDivElement>(null);

  // Get post data from context (pre-fetched at layout level)
  const { postDetailData, isPostLoading } = useEventData();
  const markPostNotificationsAsRead = useMarkPostNotificationsAsRead();

  // Note: Post presence tracking is handled by RepliesSection via useCurrentUserPostPresence
  // which provides roomToken for typing indicators. No need to track presence here too.

  const postTitle = postDetailData?.post?.title || '';

  // Auto-mark post-related notifications as read when page loads
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await markPostNotificationsAsRead(postId as Id<'posts'>);
      } catch (err) {
        // Silently fail - don't block page rendering
        console.error('Failed to mark post notifications as read:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [postId, markPostNotificationsAsRead]);

  // Show skeleton while post data is loading
  if (isPostLoading || !postDetailData) {
    return <PostDetailSkeleton />;
  }

  return (
    <>
      <PostStickyHeader postTitle={postTitle} postRef={postRef} />
      <FullPost data={postDetailData} postRef={postRef} />
    </>
  );
}

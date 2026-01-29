'use client';

import { FullPost } from './full-post';
import { PostStickyHeader } from './post-sticky-header';
import { useRef, useEffect } from 'react';
import { usePostDetail } from '@/hooks/convex/use-posts';
import { useMarkPostNotificationsAsRead } from '@/hooks/convex/use-replies';
import { useCurrentUserProfile } from '@/hooks/convex/use-users';
import { usePostPresence } from '@/hooks/convex/use-presence';
import { Id } from '@/convex/_generated/dataModel';

export function PostDetailPage({ postId }: { postId: string }) {
  const postRef = useRef<HTMLDivElement>(null);

  // Fetch post data with real-time updates using Convex
  const postData = usePostDetail(postId as Id<'posts'>);
  const markPostNotificationsAsRead = useMarkPostNotificationsAsRead();

  // Get current user's personId for presence tracking
  const profile = useCurrentUserProfile();
  const personId = profile?.person?.id as Id<'persons'> | undefined;

  // Track user presence in this post thread
  // This allows the notification system to skip notifying users who are actively viewing
  usePostPresence(postId as Id<'posts'>, personId);

  const postTitle = postData?.post?.title || '';

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

  return (
    <>
      <PostStickyHeader postTitle={postTitle} postRef={postRef} />
      <FullPost postId={postId} postRef={postRef} />
    </>
  );
}

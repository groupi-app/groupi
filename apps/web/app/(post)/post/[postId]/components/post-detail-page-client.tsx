'use client';

import { FullPostClient } from './full-post-client';
import { PostStickyHeader } from './post-sticky-header';
import { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPostDetail } from '@/lib/queries/post-queries';
import { qk } from '@/lib/query-keys';
import type { PostDetailPageData } from '@groupi/schema/data';

type Post = PostDetailPageData['post'];

interface PostDetailPageClientProps {
  postId: string;
  initialPost: Post;
  initialUserMembership: PostDetailPageData['userMembership'];
  initialUserId: string;
}

export function PostDetailPageClient({ 
  postId, 
  initialPost,
  initialUserMembership,
  initialUserId,
}: PostDetailPageClientProps) {
  const postRef = useRef<HTMLDivElement>(null);
  
  // Fetch post data for sticky header (use React Query to get latest)
  const { data: postData } = useQuery<PostDetailPageData>({
    queryKey: qk.posts.detail(postId),
    queryFn: () => fetchPostDetail(postId),
    staleTime: 30 * 1000,
    initialData: {
      post: initialPost,
      userMembership: initialUserMembership,
    } as PostDetailPageData,
  });

  const postTitle = postData?.post?.title || initialPost?.title || '';

  // Auto-mark post-related notifications as read when page loads
  // Import action lazily to avoid bundling issues with Next.js cache components
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { markPostNotificationsAsReadAction } = await import('@/actions/notification-actions');
        await markPostNotificationsAsReadAction({ postId });
      } catch (err) {
        // Silently fail - don't block page rendering
        console.error('Failed to mark post notifications as read:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [postId]);

  return (
    <>
      <PostStickyHeader postTitle={postTitle} postRef={postRef} />
      <FullPostClient
        post={initialPost}
        userMembership={initialUserMembership}
        userId={initialUserId}
        postRef={postRef}
      />
    </>
  );
}


'use client';

import { use } from 'react';
import { PostDetailPage as PostDetail } from './components/post-detail-page';
import { Replies } from './components/replies';

/**
 * Post Detail Page - Client-only architecture
 * - Each component handles its own loading state via Convex hooks
 * - Real-time updates via Convex subscriptions
 * - Authentication handled by Convex auth system
 */
export default function PostDetailPage(props: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(props.params);

  return (
    <div className='container max-w-4xl'>
      <PostDetail postId={postId} />
      <Replies postId={postId} />
    </div>
  );
}

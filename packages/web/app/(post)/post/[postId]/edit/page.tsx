'use client';

import { PostEditWrapper } from '../components/post-edit-wrapper';
import { PostEditorSkeleton } from '@/components/skeletons/post-detail-skeleton';
import { Suspense, use } from 'react';

/**
 * Post Edit Page - Client-only architecture
 * - Authentication handled at layout level
 * - Real-time post editing with Convex mutations
 */
export default function PostEditPage(props: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(props.params);

  return (
    <div className='container'>
      <Suspense fallback={<PostEditorSkeleton />}>
        <PostEditWrapper postId={postId} />
      </Suspense>
    </div>
  );
}

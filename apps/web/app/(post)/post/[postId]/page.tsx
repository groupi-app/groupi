import { FullPostServer } from './components/full-post-server';
import { Replies } from './components/replies';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

/**
 * Post Detail Page - Now uses cache components for optimal performance
 * - Post data fetched with short-lived cache (30 sec TTL)
 * - Realtime updates via Supabase for instant collaborative experience
 * - Suspense provides loading states
 * - Cache automatically invalidates on post/reply mutations
 */
export default function PostDetailPage(props: {
  params: Promise<{ postId: string }>;
}) {
  return (
    <div className='container max-w-4xl'>
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function PostDetailContent(props: {
  params: Promise<{ postId: string }>;
}) {
  const params = await props.params;
  const { postId } = params;

  return (
    <>
      <FullPostServer postId={postId} />
      <Replies postId={postId} />
    </>
  );
}

function PostDetailSkeleton() {
  return (
    <div className='space-y-6 py-8'>
      <div className='space-y-4'>
        <Skeleton className='h-8 w-3/4' />
        <div className='flex items-center gap-3'>
          <Skeleton className='rounded-full size-12' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-6 w-32' />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex gap-3'>
            <Skeleton className='rounded-full size-10' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

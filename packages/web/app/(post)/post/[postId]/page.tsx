import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { Icons } from '@/components/icons';
import { PostDetailPage as PostDetail } from './components/post-detail-page';
import { Replies } from './components/replies';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Post Detail Page - Fully migrated to Convex
 * - All data fetching handled by Convex hooks in client components
 * - Real-time updates via Convex subscriptions
 * - Simplified server component just provides routing
 * - Authentication handled by Convex auth system
 */
export default async function PostDetailPage(props: {
  params: Promise<{ postId: string }>;
}) {
  const params = await props.params;
  const { postId } = params;

  return (
    <div className='container max-w-4xl'>
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetail postId={postId as Id<'posts'>} />
        <Replies postId={postId as Id<'posts'>} />
      </Suspense>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <>
      {/* Post section */}
      <div className='pt-6 pb-0'>
        {/* Back button and actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Icons.back className='w-4 h-4' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='w-8 h-8 rounded-md' />
        </div>

        {/* Post content */}
        <div className='my-6 border-border rounded-lg'>
          {/* Author info */}
          <div className='flex items-center gap-3 mb-4'>
            <Skeleton className='rounded-full size-10' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>

          {/* Post title and content */}
          <div>
            <Skeleton className='h-8 w-3/4 mb-3' />
            <div className='prose prose-sm max-w-none py-2 space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </div>
          </div>
        </div>
      </div>

      {/* Replies section */}
      <div className='flex flex-col mt-6'>
        {/* Divider between post and replies */}
        <div className='border-t border-border mb-6'></div>
        <div className='flex flex-col gap-4 -mx-4 sm:mx-0'>
          {/* Reply items */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex items-start gap-3 py-3 px-2'>
              <Skeleton className='size-10 rounded-full shrink-0' />
              <div className='flex-1 min-w-0'>
                <div className='flex items-baseline gap-2 mb-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-16' />
                </div>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-4/5 mt-1' />
              </div>
            </div>
          ))}

          {/* Reply form */}
          <div className='border border-border rounded-lg p-4 space-y-3'>
            <div className='flex items-start gap-3'>
              <Skeleton className='size-8 rounded-full' />
              <div className='flex-1 space-y-3'>
                <Skeleton className='h-20 w-full rounded-md' />
                <div className='flex justify-end'>
                  <Skeleton className='h-9 w-20' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

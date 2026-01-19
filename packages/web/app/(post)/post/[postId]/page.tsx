import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PostDetailPageClient } from './components/post-detail-page-client';
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
        <PostDetailPageClient postId={postId as Id<"posts">} />
        <Replies postId={postId as Id<"posts">} />
      </Suspense>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className='space-y-6 py-8'>
      {/* Back button and actions */}
      <div className='flex items-center justify-between'>
        <Link
          className='flex items-center gap-2 hover:cursor-pointer hover:opacity-80'
          href='#'
        >
          <Icons.back className='w-4 h-4' />
          <span>Back</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='w-8 h-8 p-0 text-foreground hover:text-foreground flex items-center justify-center rounded-md hover:bg-accent'>
              <Icons.more className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>

      {/* Post content */}
      <div className='border rounded-lg p-6 space-y-4'>
        {/* Author info */}
        <div className='flex items-center gap-3 pb-2 border-b'>
          <Skeleton className='rounded-full size-10' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>

        {/* Post title and content */}
        <div className='space-y-3'>
          <Skeleton className='h-8 w-3/4' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
          </div>
        </div>

        {/* Replies count */}
        <div className='pt-4 border-t'>
          <div className='flex items-center gap-1'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>
      </div>

      {/* Replies section */}
      <div className='space-y-4'>
        <Skeleton className='h-7 w-24' />
        <div className='space-y-4'>
          {/* Reply form */}
          <div className='space-y-2'>
            <Skeleton className='h-24 w-full rounded-md' />
            <Skeleton className='h-10 w-24 ml-auto' />
          </div>

          {/* Reply items */}
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
    </div>
  );
}

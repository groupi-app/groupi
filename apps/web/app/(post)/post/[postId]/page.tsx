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
import { getCachedPostWithReplies, getUserId } from '@groupi/services/server';
import { redirect } from 'next/navigation';

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

  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error || !postData) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading post</p>
      </div>
    );
  }

  const { post, userMembership } = postData;

  if (!post || !userMembership) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading post</p>
      </div>
    );
  }

  return (
    <>
      <PostDetailPageClient
        key='post-detail'
        postId={postId}
        initialPost={post}
        initialUserMembership={userMembership}
        initialUserId={userId}
      />
      <Replies key='replies' postId={postId} />
    </>
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

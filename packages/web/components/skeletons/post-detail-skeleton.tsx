import { Skeleton } from '../ui/skeleton';
import { PostCardSkeleton } from './post-card-skeleton';
import { ReplyListSkeleton, ReplyFormSkeleton } from './reply-skeleton';

export function PostDetailSkeleton() {
  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      {/* Post content */}
      <PostCardSkeleton />

      {/* Reply form */}
      <div className='px-4'>
        <div className='mb-4'>
          <Skeleton className='h-5 w-20' />
        </div>
        <ReplyFormSkeleton />
      </div>

      {/* Replies list */}
      <div className='px-4'>
        <div className='flex items-center justify-between mb-4'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-16' />
        </div>
        <ReplyListSkeleton />
      </div>

      {/* Load more button */}
      <div className='flex justify-center pt-4'>
        <Skeleton className='h-9 w-24' />
      </div>
    </div>
  );
}

export function PostFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PostEditorSkeleton() {
  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      {/* Title input */}
      <div className='space-y-2'>
        <Skeleton className='h-5 w-12' />
        <Skeleton className='h-10 w-full' />
      </div>

      {/* Content editor */}
      <div className='space-y-2'>
        <Skeleton className='h-5 w-16' />
        <Skeleton className='h-64 w-full rounded-lg' />
      </div>

      {/* Action buttons */}
      <div className='flex justify-end gap-2'>
        <Skeleton className='h-10 w-20' />
        <Skeleton className='h-10 w-24' />
      </div>
    </div>
  );
}
import { Skeleton } from '../ui/skeleton';
import { ReplyListSkeleton, ReplyFormSkeleton } from './reply-skeleton';
import { Icons } from '@/components/icons';

export function PostDetailSkeleton() {
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
          <ReplyListSkeleton />

          {/* Reply form */}
          <ReplyFormSkeleton />
        </div>
      </div>
    </>
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
        <Skeleton className='h-64 w-full rounded-card' />
      </div>

      {/* Action buttons */}
      <div className='flex justify-end gap-2'>
        <Skeleton className='h-10 w-20' />
        <Skeleton className='h-10 w-24' />
      </div>
    </div>
  );
}

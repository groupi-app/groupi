import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function PostCardSkeleton() {
  return (
    <Card treatment='quiet' edge='none' className='relative w-full max-w-4xl'>
      <Skeleton className='absolute top-4 left-3 size-10 rounded-full' />
      <Skeleton className='absolute top-2 right-2 size-11 rounded-button' />
      <div className='w-full pt-4 px-5 pb-2'>
        <div className='flex flex-col gap-1'>
          <div className='ml-12 mb-2 flex min-w-0 flex-col pr-12'>
            <Skeleton className='h-5 w-full max-w-60 sm:h-7' />
            <Skeleton className='h-5 w-24 max-w-full' />
          </div>
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
          <div className='flex items-center justify-between gap-4 mt-2'>
            <Skeleton className='h-5 w-32 max-w-[50%]' />
            <Skeleton className='h-5 w-16' />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PostFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='w-full flex flex-col items-center gap-3 py-2'>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

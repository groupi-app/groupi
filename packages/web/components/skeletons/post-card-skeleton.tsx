import { Skeleton } from '../ui/skeleton';

export function PostCardSkeleton() {
  return (
    <div className='rounded-card border border-border w-full relative shadow-raised max-w-4xl'>
      <div className='w-full transition-all pt-4 px-5 pb-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Skeleton className='size-10 rounded-full' />
            <div className='flex flex-col space-y-1'>
              <Skeleton className='w-36 h-4' />
              <Skeleton className='w-16 h-3' />
            </div>
          </div>
          <div className='flex flex-wrap gap-1'>
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-3/4 h-4' />
          </div>
          <div className='flex items-center justify-between mt-2'>
            <Skeleton className='w-16 h-4' />
            <Skeleton className='w-16 h-4' />
          </div>
        </div>
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

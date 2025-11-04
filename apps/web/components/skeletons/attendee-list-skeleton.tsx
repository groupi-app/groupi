import { Skeleton } from '../ui/skeleton';

export function AttendeeListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-7 w-32' />
        <Skeleton className='h-6 w-16' />
      </div>

      <div className='space-y-3'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 p-2'>
            <Skeleton className='rounded-full size-12' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-8 w-20' />
          </div>
        ))}
      </div>
    </div>
  );
}

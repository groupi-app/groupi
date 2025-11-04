import { Skeleton } from '../ui/skeleton';

export function EventListSkeleton() {
  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4'>
        <Skeleton className='h-12 w-48' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-36' />
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className='border rounded-lg p-4 space-y-3'>
      <Skeleton className='h-8 w-3/4' />
      <div className='flex items-center gap-2'>
        <Skeleton className='size-5' />
        <Skeleton className='h-4 w-32' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-5' />
        <Skeleton className='h-4 w-48' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-5' />
        <Skeleton className='h-4 w-24' />
      </div>
    </div>
  );
}

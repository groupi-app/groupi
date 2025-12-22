import { Skeleton } from '../ui/skeleton';

export function EventListSkeleton() {
  return (
    <div>
      {/* Event cards */}
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
    <div className='flex flex-col gap-2 border border-border shadow-md p-4 px-6 rounded-md'>
      <div className='flex flex-col md:flex-row gap-2 md:gap-8'>
        {/* Title and description */}
        <div className='flex flex-col grow gap-2 md:w-1/2'>
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </div>

        {/* Location, date, and timestamps */}
        <div className='flex flex-col md:w-1/2 justify-between gap-2'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1'>
              <Skeleton className='size-6 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex items-center gap-1'>
              <Skeleton className='size-6 rounded-full' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-3 w-36' />
          </div>
        </div>
      </div>
    </div>
  );
}

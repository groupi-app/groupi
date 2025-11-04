import { Skeleton } from '../ui/skeleton';
import { CalendarSkeleton } from './calendar-skeleton';

export function AvailabilityFormSkeleton() {
  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-96' />
      </div>

      <CalendarSkeleton />

      <div className='space-y-3'>
        <Skeleton className='h-6 w-40' />
        <div className='grid grid-cols-2 gap-3'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </div>

      <div className='flex gap-3 justify-end'>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}

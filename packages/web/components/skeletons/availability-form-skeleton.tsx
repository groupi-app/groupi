import { Skeleton } from '../ui/skeleton';
import { CalendarSkeleton } from './calendar-skeleton';

export function AvailabilityFormSkeleton() {
  return (
    <div>
      {/* Heading */}
      <div className='my-2'>
        <h2 className='font-heading text-4xl'>When are you around?</h2>
        <p className='text-muted-foreground text-lg'>
          Don&apos;t worry. You can update this later.
        </p>
      </div>

      {/* Timezone and calendar */}
      <div className='py-4 w-full'>
        <span className='text-sm italic text-muted-foreground'>
          Current timezone: <Skeleton className='inline-block h-4 w-48' />
        </span>
        <div className='mt-4'>
          <CalendarSkeleton />
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex gap-3 justify-end mt-6'>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}

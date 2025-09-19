import { CalendarSkeleton } from '@/components/skeletons/calendar-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
  return (
    <div className='container max-w-4xl'>
      <div className='my-8 flex flex-col gap-6'>
        <Skeleton className='h-12 w-96' />
        <CalendarSkeleton />
        <Skeleton className='h-8 w-24 mx-auto' />
        <Skeleton className='h-10 w-72 mx-auto' />
        <div className='flex justify-between'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-24' />
        </div>
      </div>
    </div>
  );
}

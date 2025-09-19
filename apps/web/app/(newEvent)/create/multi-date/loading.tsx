import { CalendarSkeleton } from '@/components/skeletons/calendar-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
  return (
    <div className='container max-w-4xl py-8'>
      <Skeleton className='h-12 w-96' />
      <div className='flex items-center md:items-start gap-5 md:gap-0 flex-col md:flex-row md:justify-evenly'>
        <div className='my-8 flex flex-col gap-6'>
          <CalendarSkeleton />
          <Skeleton className='h-8 w-24 mx-auto' />
          <Skeleton className='h-10 w-72 mx-auto' />
        </div>
        <div className='my-8'>
          <Skeleton className='w-72 h-96' />
        </div>
      </div>
      <div className='flex justify-between'>
        <Skeleton className='h-8 w-24' />
        <Skeleton className='h-8 w-24' />
      </div>
    </div>
  );
}

import { Skeleton } from '../ui/skeleton';

export function NewEventFormSkeleton() {
  return (
    <div className='gap-6 flex flex-col'>
      {/* Title field */}
      <div className='space-y-2'>
        <Skeleton className='h-5 w-16' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-4 w-64' />
      </div>

      {/* Description field */}
      <div className='space-y-2'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-4 w-72' />
      </div>

      {/* Location field */}
      <div className='space-y-2'>
        <Skeleton className='h-5 w-20' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-4 w-80' />
      </div>

      {/* Next button */}
      <div className='flex justify-end'>
        <Skeleton className='h-10 w-24' />
      </div>
    </div>
  );
}

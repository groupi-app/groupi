import { Skeleton } from '../ui/skeleton';

export function InviteDetailsSkeleton() {
  return (
    <div className='container max-w-2xl py-8 space-y-6'>
      <div className='space-y-3'>
        <Skeleton className='h-10 w-3/4' />
        <Skeleton className='h-6 w-1/2' />
      </div>

      <div className='space-y-4 border rounded-lg p-6'>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6' />
          <Skeleton className='h-4 w-32' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6' />
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6' />
          <Skeleton className='h-4 w-24' />
        </div>
      </div>

      <div className='flex gap-3'>
        <Skeleton className='h-12 flex-1' />
        <Skeleton className='h-12 flex-1' />
      </div>
    </div>
  );
}

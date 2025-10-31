import { Skeleton } from '../ui/skeleton';

export function AdminDashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-10 w-64' />

      <div className='grid gap-4'>
        <div className='border rounded-lg p-6 space-y-4'>
          <Skeleton className='h-6 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>

        <div className='border rounded-lg p-6 space-y-4'>
          <Skeleton className='h-6 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>

        <div className='border rounded-lg p-6 space-y-4'>
          <Skeleton className='h-6 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>
      </div>
    </div>
  );
}

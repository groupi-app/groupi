import { Skeleton } from '../ui/skeleton';

export function AdminDashboardSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Stats skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='border rounded-lg p-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-4' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className='space-y-4'>
        <div className='flex gap-2 border-b'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-20' />
        </div>

        <div className='border rounded-lg p-6 space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-4 w-64' />
          </div>
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

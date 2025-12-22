import { Skeleton } from '../ui/skeleton';

export function AccountSettingsSkeleton() {
  return (
    <div className='space-y-6 max-w-2xl'>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-10 w-full' />
      </div>

      <div className='space-y-2'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-10 w-full' />
      </div>

      <div className='space-y-4'>
        <Skeleton className='h-5 w-40' />
        <div className='space-y-2'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      </div>

      <div className='space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-10 w-full' />
      </div>
    </div>
  );
}

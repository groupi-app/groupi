import { Skeleton } from '../ui/skeleton';

export function SettingsFormSkeleton() {
  return (
    <div className='space-y-6 max-w-2xl'>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-10 w-full' />
      </div>

      <div className='space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-10 w-full' />
      </div>

      <div className='space-y-2'>
        <Skeleton className='h-5 w-48' />
        <Skeleton className='h-24 w-full' />
      </div>

      <div className='flex items-center gap-4'>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-24' />
      </div>
    </div>
  );
}

import { Skeleton } from '../ui/skeleton';

export function NotificationListSkeleton() {
  return (
    <div className='space-y-2'>
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className='flex items-start gap-3 p-3 border border-border rounded-dropdown'>
      <Skeleton className='size-10 rounded-full' />
      <div className='flex-1 space-y-2'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-3 w-12' />
        </div>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-5/6' />
        <div className='flex items-center gap-2 pt-1'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-3 w-20' />
        </div>
      </div>
    </div>
  );
}

export function NotificationWidgetSkeleton() {
  return (
    <div className='relative'>
      <Skeleton className='size-6 rounded-full' />
      <Skeleton className='absolute -top-1 -right-1 size-4 rounded-full' />
    </div>
  );
}

export function NotificationDropdownSkeleton() {
  return (
    <div className='w-80 max-h-96 overflow-hidden'>
      <div className='border-b border-border p-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-16' />
        </div>
      </div>
      <div className='p-2 space-y-2 max-h-80 overflow-y-auto'>
        <NotificationSkeleton />
        <NotificationSkeleton />
        <NotificationSkeleton />
        <NotificationSkeleton />
      </div>
      <div className='border-t border-border p-3'>
        <Skeleton className='h-4 w-full' />
      </div>
    </div>
  );
}

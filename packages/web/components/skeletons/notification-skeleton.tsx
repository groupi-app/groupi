import { Skeleton } from '../ui/skeleton';

/**
 * NotificationListSkeleton - Skeleton for the notification list
 *
 * Note: The NotificationWidget uses a custom inline skeleton that includes
 * actual interactive tabs. This component is for the list items only.
 */
export function NotificationListSkeleton() {
  return (
    <div className='flex flex-col'>
      <NotificationSkeleton />
      <NotificationSkeleton hasUnreadDot />
      <NotificationSkeleton />
      <NotificationSkeleton hasUnreadDot />
      <NotificationSkeleton />
    </div>
  );
}

/**
 * NotificationSkeleton - Skeleton for a single notification item
 * Matches NotificationSlate: unread dot, message, timestamp
 */
export function NotificationSkeleton({
  hasUnreadDot = false,
}: {
  hasUnreadDot?: boolean;
}) {
  return (
    <div className='flex items-center gap-3 p-2 pr-10'>
      {/* Unread indicator dot - show on some items for visual variety */}
      {hasUnreadDot && <Skeleton className='size-2 rounded-full shrink-0' />}
      <div className='flex flex-col gap-1 px-2 flex-1'>
        {/* Message text */}
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
        {/* Timestamp */}
        <Skeleton className='h-3 w-24' />
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

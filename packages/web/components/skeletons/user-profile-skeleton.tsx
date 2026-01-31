import { Skeleton } from '../ui/skeleton';

export function UserProfileSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Profile header */}
      <div className='flex items-start gap-4'>
        <Skeleton className='size-20 rounded-full' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
          </div>
        </div>
      </div>

      {/* Profile stats */}
      <div className='flex gap-6'>
        <div className='text-center'>
          <Skeleton className='h-6 w-8 mx-auto mb-1' />
          <Skeleton className='h-3 w-12' />
        </div>
        <div className='text-center'>
          <Skeleton className='h-6 w-8 mx-auto mb-1' />
          <Skeleton className='h-3 w-16' />
        </div>
        <div className='text-center'>
          <Skeleton className='h-6 w-8 mx-auto mb-1' />
          <Skeleton className='h-3 w-14' />
        </div>
      </div>

      {/* Profile actions */}
      <div className='flex gap-3'>
        <Skeleton className='h-9 w-24' />
        <Skeleton className='h-9 w-20' />
      </div>
    </div>
  );
}

export function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-3'>
      {Array.from({ length: count }, (_, i) => (
        <UserListItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function UserListItemSkeleton() {
  return (
    <div className='flex items-center gap-3 p-3 border border-border rounded-dropdown'>
      <Skeleton className='size-10 rounded-full' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-3 w-24' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-8 w-8 rounded-full' />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className='border border-border rounded-card p-4 space-y-4'>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-12 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-5 w-36' />
          <Skeleton className='h-3 w-24' />
        </div>
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-4/5' />
      </div>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-3 w-20' />
        <Skeleton className='h-8 w-20' />
      </div>
    </div>
  );
}

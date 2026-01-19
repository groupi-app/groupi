import { Skeleton } from '../ui/skeleton';

export function ReplyListSkeleton() {
  return (
    <div className='flex flex-col gap-3'>
      <ReplySkeleton />
      <ReplySkeleton />
      <ReplySkeleton />
      <ReplySkeleton />
    </div>
  );
}

export function ReplySkeleton() {
  return (
    <div className='flex items-start gap-3 py-3 px-2'>
      <Skeleton className='size-10 rounded-full shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-baseline gap-2 mb-1'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-4/5 mt-1' />
      </div>
    </div>
  );
}

export function ReplyFormSkeleton() {
  return (
    <div className='border border-border rounded-lg p-4 space-y-3'>
      <div className='flex items-start gap-3'>
        <Skeleton className='size-8 rounded-full' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-20 w-full rounded-md' />
          <div className='flex justify-end'>
            <Skeleton className='h-9 w-20' />
          </div>
        </div>
      </div>
    </div>
  );
}
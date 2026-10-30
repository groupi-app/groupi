import { Skeleton } from '@/components/ui/skeleton';
import { EventHeaderLayout } from '@/components/templates/event-header-layout';

export function EventHeaderSkeleton() {
  return (
    <EventHeaderLayout
      aria-hidden='true'
      title={<Skeleton className='h-12 w-3/4 max-w-lg' />}
      actions={<Skeleton className='size-12 rounded-button' />}
      metadata={
        <>
          <div className='flex min-w-0 items-center gap-2.5'>
            <Skeleton className='size-10 shrink-0 rounded-full' />
            <Skeleton className='h-5 w-56 max-w-[75%]' />
          </div>
          <div className='flex min-w-0 items-center gap-2.5'>
            <Skeleton className='size-4 shrink-0 rounded-full' />
            <Skeleton className='h-5 w-24' />
          </div>
        </>
      }
    />
  );
}

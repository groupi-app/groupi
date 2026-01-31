import { Skeleton } from '../ui/skeleton';

export function MemberListSkeleton() {
  return (
    <div>
      {/* Header with title, count badge, and invite button */}
      <div className='flex items-center gap-2'>
        <h2 className='text-xl font-heading font-medium'>Attendees</h2>
        <div className='rounded-full p-[.3rem] flex items-center justify-center text-xs bg-muted text-muted-foreground text-center'>
          <Skeleton className='h-3 w-6' />
        </div>
        <Skeleton className='h-8 w-20 rounded-md' />
      </div>

      {/* Member icons */}
      <div className='flex items-center p-2 -space-x-2 h-[54px] overflow-hidden'>
        <Skeleton className='rounded-full size-10 border-2 border-background' />
        <Skeleton className='rounded-full size-10 border-2 border-background' />
        <Skeleton className='rounded-full size-10 border-2 border-background' />
        <Skeleton className='rounded-full size-10 border-2 border-background' />
        <Skeleton className='rounded-full size-10 border-2 border-background' />
      </div>

      {/* View All link */}
      <span className='rounded-full z-top text-primary hover:underline mt-1'>
        View All
      </span>
    </div>
  );
}

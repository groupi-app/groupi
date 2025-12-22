import { Skeleton } from '../ui/skeleton';
import { Icons } from '../icons';

export function AttendeeListSkeleton() {
  return (
    <div className='flex flex-col gap-2 divide-y'>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2 py-2 items-center'>
            {/* Column 1: Member icon + name */}
            <div className='flex items-center gap-2'>
              <Skeleton className='rounded-full size-10 border-2 border-background' />
              <div>
                <Skeleton className='h-5 w-32 mb-1' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>

            {/* Column 2: Role with icon */}
            <div className='flex items-center text-muted-foreground gap-1'>
              <Icons.account className='size-4' />
              <Skeleton className='h-4 w-16' />
            </div>

            {/* Column 3: RSVP/Availability */}
            <div className='flex items-center gap-1 text-muted-foreground'>
              <span>RSVP: </span>
              <Skeleton className='h-4 w-12' />
            </div>

            {/* Column 4: Action buttons */}
            <div className='flex items-center gap-1'>
              <Skeleton className='h-9 w-9 rounded-md' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '../icons';
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu';

export function EventHeaderSkeleton() {
  return (
    <header className='flex flex-col md:my-5 max-w-4xl mx-auto gap-3'>
      {/* Title and dropdown menu */}
      <div className='flex justify-between flex-col-reverse gap-3 md:flex-row'>
        <Skeleton className='h-12 w-96' />
        <DropdownMenu>
          <DropdownMenuTrigger className='size-12 hover:bg-accent transition-all rounded-md flex items-center justify-center'>
            <Icons.more className='size-8' />
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
      
      {/* Location and date */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-1 text-muted-foreground'>
          <Icons.location className='size-6 text-primary' />
          <Skeleton className='h-4 w-32' />
        </div>
        <div className='flex items-center gap-1 text-muted-foreground'>
          <Icons.date className='size-6 text-primary' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      
      {/* Description */}
      <Skeleton className='h-4 w-full' />
      <Skeleton className='h-4 w-5/6' />
      
      {/* RSVP section */}
      <div className='mt-2'>
        <Skeleton className='h-10 w-48' />
      </div>
    </header>
  );
}


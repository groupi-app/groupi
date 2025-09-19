import { Icons } from '@/components/icons';
import { Toolbar } from '@/app/(post)/post/[postId]/components/toolbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
  return (
    <div className='container pt-6'>
      <Button variant={'ghost'} className='flex items-center gap-1 pl-2 mb-4'>
        <Icons.back />
        <span>Back</span>
      </Button>
      <Skeleton className='w-1/2 h-12 my-8' />
      <Toolbar.Skeleton />
      <div className='flex flex-col gap-1'>
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-full h-4' />
        <Skeleton className='w-1/2 h-4' />
      </div>
      <Button className='w-full md:w-max flex items-center gap-1 mt-4'>
        <Icons.save className='size-4' />
        <span>Save</span>{' '}
      </Button>
    </div>
  );
}

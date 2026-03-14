import { Icons } from '@/components/icons';
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
      <Skeleton className='w-full h-[300px] rounded-card' />
      <Button
        className='w-full md:w-auto flex items-center gap-1 mt-4'
        disabled
      >
        <Icons.save className='size-4' />
        <span>Update Post</span>
      </Button>
    </div>
  );
}

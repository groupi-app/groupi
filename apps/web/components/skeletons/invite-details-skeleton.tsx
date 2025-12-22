import { Skeleton } from '../ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Icons } from '../icons';

export function InviteDetailsSkeleton() {
  return (
    <div className='flex justify-center items-center h-screen'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardDescription>You have been invited to</CardDescription>
          <CardTitle>
            <Skeleton className='h-7 w-3/4' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Description */}
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-4 w-5/6 mb-4' />
          
          {/* Event details */}
          <div className='flex flex-col gap-2 my-4'>
            {/* Location */}
            <div className='flex items-center gap-1'>
              <Icons.location className='size-6 text-primary' />
              <Skeleton className='h-4 w-32' />
            </div>
            {/* Date */}
            <div className='flex items-center gap-1'>
              <Icons.date className='size-6 text-primary' />
              <Skeleton className='h-4 w-48' />
            </div>
            {/* Member count */}
            <div className='flex items-center gap-1'>
              <Icons.people className='size-6 text-primary' />
              <Skeleton className='h-4 w-16' />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className='flex justify-end w-full'>
            <Skeleton className='h-10 w-32' />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';

import { useEventChangeDate } from '@groupi/hooks';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ChangeDateContent({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventChangeDate(eventId);

  if (isLoading || !data) {
    return (
      <div className='container max-w-4xl'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  const [error, changeDateData] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'NotFoundError':
        errorMessage = 'Event not found';
        break;
      case 'UnauthorizedError':
        errorMessage = 'You are not a member of this event';
        break;
      case 'AuthenticationError':
        errorMessage = 'Please sign in';
        break;
      case 'DatabaseError':
        errorMessage = 'Failed to load event data';
        break;
    }

    return (
      <div className='container max-w-4xl'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const { event } = changeDateData;

  return (
    <div className='container max-w-4xl'>
      <div className='w-max my-2'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>{event.title}</span>
          </Button>
        </Link>
      </div>
      <h2 className='font-heading text-4xl mt-10'>I would like to...</h2>
      <div className='flex my-12 gap-4 justify-center flex-col md:flex-row items-center'>
        <Link
          data-test='single-date-button'
          className='w-full max-w-md'
          href={`/event/${eventId}/change-date/single`}
        >
          <Button
            size='lg'
            variant='outline'
            className='py-12 text-xl w-full flex items-center justify-center gap-3'
          >
            <Icons.organizer className='size-16 min-w-[4rem]' />
            <span>Choose a date myself</span>
          </Button>
        </Link>
        <Link
          className='w-full max-w-md'
          href={`/event/${eventId}/change-date/multi`}
        >
          <Button
            size='lg'
            variant='outline'
            className='py-12 text-xl w-full flex items-center justify-center gap-3'
          >
            <Icons.group
              color2='fill-muted-foreground'
              className='size-24 min-w-[4rem]'
            />
            <span>Poll Attendees</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

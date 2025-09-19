'use client';

import { useEventDateSelect } from '@groupi/hooks';
import { DateCardList } from '../../components/date-card-list';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function DateSelectContent({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventDateSelect(eventId);

  if (isLoading || !data) {
    return (
      <div className='container max-w-5xl py-4'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading date options...</div>
        </div>
      </div>
    );
  }

  const [error, dateSelectData] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'AvailabilityNotFoundError':
      case 'AvailabilityEventNotFoundError':
        errorMessage = 'Event not found';
        break;
      case 'AvailabilityUserNotMemberError':
        errorMessage = 'You do not have permission to view this page';
        break;
      case 'UnauthorizedAvailabilityError':
      case 'UnauthorizedError':
        errorMessage = 'You do not have permission to view this page';
        break;
      case 'DatabaseError':
        errorMessage = 'Failed to load date options';
        break;
    }

    return (
      <div className='container max-w-5xl py-4'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const { potentialDateTimes } = dateSelectData;

  return (
    <div className='container max-w-5xl py-4 flex flex-col'>
      <div className='w-max my-2'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>
              {potentialDateTimes?.[0]?.dateTime
                ? 'Event Date Options'
                : 'Event'}
            </span>
          </Button>
        </Link>
      </div>
      <div>
        <h1 className='font-heading text-4xl my-4'>
          Choose a date/time for your event.
        </h1>
        <DateCardList eventId={eventId} />
      </div>
    </div>
  );
}

'use client';

import { useEventAvailability } from '@groupi/hooks';
import { AvailabilityForm } from '../../components/availability-form';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AvailabilityContent({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const { data, isLoading } = useEventAvailability(eventId);

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  if (isLoading || !data) {
    return (
      <div className='container max-w-5xl py-4'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading availability options...</div>
        </div>
      </div>
    );
  }

  const [error, availabilityData] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'NotFoundError':
        errorMessage = 'No availability data found';
        break;
      case 'UnauthorizedError':
        errorMessage = 'You are not a member of this event';
        break;
      case 'AuthenticationError':
        errorMessage = 'Please sign in to view availability';
        break;
      case 'ConnectionError':
        errorMessage = 'Network error. Please try again.';
        break;
      case 'ConstraintError':
        errorMessage = 'Invalid request';
        break;
      case 'DatabaseError':
        errorMessage = error.message || 'Failed to load availability data';
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

  const { potentialDateTimes, userRole } = availabilityData;

  if (!potentialDateTimes || potentialDateTimes.length === 0) {
    return (
      <div className='container max-w-5xl py-4'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold'>No Date Options</h1>
          <p className='mt-2'>Voting is not enabled for this event</p>
        </div>
      </div>
    );
  }

  if (userRole === 'ORGANIZER') {
    return (
      <div className='container max-w-5xl py-4'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold'>Access Restricted</h1>
          <p className='mt-2'>Organizers cannot vote on availabilities</p>
        </div>
      </div>
    );
  }

  // Find current user's availabilities across all dates
  const memberAvailabilities = potentialDateTimes.flatMap(pdt =>
    pdt.availabilities.filter(avail => avail.membership.person.id === userId)
  );

  return (
    <div className='container max-w-5xl py-4'>
      <div>
        {memberAvailabilities && memberAvailabilities.length > 0 && (
          <div className='w-max'>
            <Link data-test='full-post-back' href={`/event/${eventId}`}>
              <Button
                variant={'ghost'}
                className='flex items-center gap-1 pl-2'
              >
                <Icons.back />
                <span>Back to Event</span>
              </Button>
            </Link>
          </div>
        )}

        <div className='my-2'>
          <h1 className='font-heading text-4xl'>When are you around?</h1>
          <h2 className='text-muted-foreground text-lg'>
            Don&apos;t worry. You can update this later.
          </h2>
        </div>
      </div>
      <div className='py-4 w-full'>
        <span className='text-sm italic text-muted-foreground'>
          Current timezone: {getTimezoneString()}
        </span>
        <AvailabilityForm
          potentialDateTimes={potentialDateTimes}
          userId={userId}
        />
      </div>
    </div>
  );
}

'use client';

import { AvailabilityForm } from '../../components/availability-form';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import { useEventData } from '../../context';

export function AvailabilityContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  // Use context data (pre-fetched at layout level)
  const { availabilityData, currentUser } = useEventData();

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  // Loading state
  if (!availabilityData || !currentUser) {
    return (
      <div className='container max-w-5xl py-4'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading availability data...</div>
        </div>
      </div>
    );
  }

  // Note: The Convex query already validates membership and throws if not a member
  // If we reach here, user is a valid member

  const { potentialDateTimes, userRole, userId } = availabilityData;

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

  // Find current user's availabilities across all dates - using simpler approach for better type inference
  const memberAvailabilities = [];
  for (const pdt of potentialDateTimes) {
    for (const avail of pdt.availabilities || []) {
      if (avail.member?.person?._id === userId) {
        memberAvailabilities.push(avail);
      }
    }
  }

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

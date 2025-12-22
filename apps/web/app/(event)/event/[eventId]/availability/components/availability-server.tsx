import { getCachedEventAvailabilityData } from '@groupi/services/server';
import { AvailabilityClient } from './availability-client';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cacheLife } from 'next/cache';

/**
 * Server component that fetches cached availability data
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 */
export async function AvailabilityServer({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  'use cache: private';
  cacheLife({ stale: 60 }); // Prevent prerendering, enable headers() access

  // Auth and header checks are now done in AvailabilityPageContent inside Suspense
  // userId is passed as prop (auth already checked in AvailabilityPageContent)

  const [error, availabilityData] =
    await getCachedEventAvailabilityData(eventId);

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'NotFoundError':
        errorMessage = 'No availability data found';
        break;
      case 'UnauthorizedError':
        errorMessage = 'You are not a member of this event';
        break;
      // AuthenticationError is handled at page level before Suspense
      case 'ConnectionError':
        errorMessage = 'Network error. Please try again.';
        break;
      case 'ConstraintError':
        errorMessage = 'Invalid request';
        break;
      case 'DatabaseError':
        errorMessage = 'Failed to load availability data';
        break;
    }

    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold text-red-600'>Error</h2>
        <p className='mt-2'>{errorMessage}</p>
      </div>
    );
  }

  const { potentialDateTimes, userRole } = availabilityData;

  if (!potentialDateTimes || potentialDateTimes.length === 0) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold'>No Date Options</h2>
        <p className='mt-2'>Voting is not enabled for this event</p>
      </div>
    );
  }

  if (userRole === 'ORGANIZER') {
    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold'>Access Restricted</h2>
        <p className='mt-2'>Organizers cannot vote on availabilities</p>
      </div>
    );
  }

  // Check if user has any availabilities set
  const memberAvailabilities = potentialDateTimes.flatMap(pdt =>
    pdt.availabilities.filter(avail => avail.membership.person.id === userId)
  );
  const hasAvailability = memberAvailabilities.length > 0;

  // Pass data to client component
  return (
    <>
      {/* Only show back button if user has already set availability */}
      {hasAvailability && (
        <div className='mb-6'>
          <Link href={`/event/${eventId}`}>
            <Button variant='ghost' className='flex items-center gap-1 pl-2'>
              <Icons.back />
              <span>Back to Event</span>
            </Button>
          </Link>
        </div>
      )}
      <AvailabilityClient
        eventId={eventId}
        userId={userId}
        potentialDateTimes={potentialDateTimes}
      />
    </>
  );
}

import { getCachedEventAvailabilityData } from '@groupi/services';
import { AvailabilityClient } from './availability-client';
import { redirect } from 'next/navigation';

/**
 * Server component that fetches cached availability data
 * Uses "use cache: private" for user-specific data
 */
export async function AvailabilityServer({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
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
      case 'AuthenticationError':
        redirect('/sign-in');
        // eslint-disable-next-line no-fallthrough
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

  // Pass data to client component
  return (
    <AvailabilityClient
      eventId={eventId}
      userId={userId}
      potentialDateTimes={potentialDateTimes}
    />
  );
}

import { getCachedMyEventsData } from '@groupi/services';
import { EventListClient } from './event-list-client';
import { redirect } from 'next/navigation';

/**
 * Server component that fetches cached events data
 * Uses "use cache" from the service layer
 */
export async function EventListServer() {
  const [error, myEventsData] = await getCachedMyEventsData();

  if (error) {
    const errorTag = '_tag' in error ? error._tag : null;
    switch (errorTag) {
      case 'AuthenticationError':
        redirect('/sign-in');
        // eslint-disable-next-line no-fallthrough
      case 'NotFoundError':
        return (
          <div className='flex items-center justify-center py-8'>
            <div className='text-lg text-red-600'>User not found</div>
          </div>
        );
      case 'DatabaseError':
        return (
          <div className='flex items-center justify-center py-8'>
            <div className='text-lg text-red-600'>
              Error loading events: {error.message}
            </div>
          </div>
        );
      default:
        return (
          <div className='flex items-center justify-center py-8'>
            <div className='text-lg text-red-600'>
              An unexpected error occurred
            </div>
          </div>
        );
    }
  }

  if (!myEventsData.memberships || myEventsData.memberships.length === 0) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-lg'>No events found.</div>
      </div>
    );
  }

  const events = myEventsData.memberships.map(membership => membership.event);
  const userId = myEventsData.id;

  // Pass static data to client component
  return (
    <EventListClient
      events={events}
      memberships={myEventsData.memberships}
      userId={userId}
    />
  );
}

import { getCachedMyEventsData } from '@groupi/services/server';
import { EventListWrapper } from './event-list-wrapper';

/**
 * Server component that fetches cached events data
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 * Component-level caching is required for PPR to skip Suspense boundaries
 */
export async function EventListServer() {
  'use cache: private';
  
  const [error, myEventsData] = await getCachedMyEventsData();

  if (error) {
    const errorTag = '_tag' in error ? error._tag : null;
    switch (errorTag) {
      // AuthenticationError is handled at page level before Suspense
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
              Error loading events
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

  // Pass static data to client wrapper component
  return (
    <EventListWrapper
      events={events}
      memberships={myEventsData.memberships}
      userId={userId}
    />
  );
}

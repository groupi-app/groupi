import { getCachedMyEventsData } from '@groupi/services';
import { EventListClient } from './event-list-client';
import { redirect } from 'next/navigation';

export async function EventList() {
  const [error, myEventsData] = await getCachedMyEventsData();

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>User not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
        // eslint-disable-next-line no-fallthrough
        break;
      default:
        return <div>Failed to load events</div>;
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

  return (
    <EventListClient
      events={events}
      memberships={myEventsData.memberships}
      userId={myEventsData.id}
    />
  );
}

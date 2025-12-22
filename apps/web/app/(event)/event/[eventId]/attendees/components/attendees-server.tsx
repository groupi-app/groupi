import { getCachedEventAttendeesData } from '@groupi/services/server';
import { AttendeesClient } from './attendees-client';
import { cacheLife } from 'next/cache';

/**
 * Server component that fetches cached attendees data
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 */
export async function AttendeesServer({ eventId }: { eventId: string }) {
  'use cache: private';
  cacheLife({ stale: 60 }); // Prevent prerendering, enable headers() access

  // Auth and availability checks are now done in AttendeesPageContent inside Suspense
  const [error, attendeesData] = await getCachedEventAttendeesData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      // AuthenticationError is handled at page level before Suspense
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>An error occurred while loading attendees.</div>;
    }
  }

  return <AttendeesClient eventId={eventId} initialData={attendeesData} />;
}

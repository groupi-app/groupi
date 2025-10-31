import { getCachedEventHeaderData } from '@groupi/services';
import { EventHeaderClient } from './event-header-client';
import { redirect } from 'next/navigation';

/**
 * Server component that fetches cached event header data
 * Uses "use cache" from the service layer
 */
export async function EventHeaderServer({ eventId }: { eventId: string }) {
  const [error, eventData] = await getCachedEventHeaderData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>An unexpected error occurred</div>;
    }
  }

  const { event, userMembership } = eventData;

  // Pass static data to client component
  return (
    <EventHeaderClient
      eventId={eventId}
      event={event}
      userMembership={userMembership}
    />
  );
}

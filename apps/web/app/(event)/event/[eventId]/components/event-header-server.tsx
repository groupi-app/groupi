import { getCachedEventHeaderData } from '@groupi/services/server';
import dynamic from 'next/dynamic';
import { componentLogger } from '@/lib/logger';

// Dynamically import EventHeaderClient to prevent bundling across route groups
const EventHeaderClient = dynamic(
  () =>
    import('./event-header-client').then(mod => ({
      default: mod.EventHeaderClient,
    })),
  { ssr: true }
);

/**
 * Server component that fetches cached event header data
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 */
export async function EventHeaderServer({ eventId }: { eventId: string }) {
  'use cache: private';

  try {
    componentLogger.debug({ eventId }, 'Fetching header data');

    const [error, eventData] = await getCachedEventHeaderData(eventId);

    if (error) {
      componentLogger.error(
        { eventId, errorTag: error._tag, error },
        'Error fetching header data'
      );
      switch (error._tag) {
        case 'NotFoundError':
          return <div>Event not found</div>;
        // AuthenticationError is handled at page level before Suspense
        case 'UnauthorizedError':
          return <div>You are not a member of this event</div>;
        default:
          return <div>An unexpected error occurred</div>;
      }
    }

    if (!eventData) {
      componentLogger.error({ eventId }, 'No event data returned');
      return <div>Failed to load event data</div>;
    }

    const { event, userMembership } = eventData;
    componentLogger.debug({ eventId }, 'Rendering EventHeaderClient');

    // Pass static data to client component
    return (
      <EventHeaderClient
        eventId={eventId}
        event={event}
        userMembership={userMembership}
      />
    );
  } catch (error) {
    componentLogger.error({ eventId, error }, 'Caught error');
    // Re-throw redirect errors
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return <div>An error occurred while loading the event header</div>;
  }
}

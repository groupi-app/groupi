import { AttendeesClient } from './attendees-client';

/**
 * Server wrapper component - Client-only architecture
 * - Simply passes eventId to client component
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function AttendeesServer({ eventId }: { eventId: string }) {
  return <AttendeesClient eventId={eventId} />;
}

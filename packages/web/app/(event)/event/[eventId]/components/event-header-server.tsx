import { EventHeaderClient } from './event-header-client';

/**
 * Server wrapper component - Client-only architecture
 * - Simply passes eventId to client component
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function EventHeaderServer({ eventId }: { eventId: string }) {
  return <EventHeaderClient eventId={eventId} />;
}

import { AvailabilityClient } from './availability-client';

/**
 * Server wrapper component - Client-only architecture
 * - Simply passes eventId to client component (userId no longer needed)
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function AvailabilityServer({
  eventId,
}: {
  eventId: string;
}) {
  return <AvailabilityClient eventId={eventId} />;
}

import { MemberListClient } from './member-list-client';

/**
 * Server wrapper component - Client-only architecture
 * - Simply passes eventId to client component
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function MemberListServer({ eventId }: { eventId: string }) {
  return <MemberListClient eventId={eventId} />;
}

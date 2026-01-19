import { EventListWrapper } from './event-list-wrapper';

/**
 * Server wrapper component - Client-only architecture
 * - Simply renders client wrapper component
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function EventListServer() {
  return <EventListWrapper />;
}

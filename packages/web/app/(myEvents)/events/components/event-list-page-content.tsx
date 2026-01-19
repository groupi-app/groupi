'use client';

import { EventList } from './event-list';

/**
 * My Events page content component - Client-only architecture
 * - Authentication handled at layout level
 * - All data fetching handled by EventListClient with Convex hooks
 * - Real-time updates via Convex subscriptions
 */
export function EventListPageContent() {
  return <EventList />;
}

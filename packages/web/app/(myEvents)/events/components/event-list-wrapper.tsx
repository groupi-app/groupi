'use client';

import { EventList } from './event-list';
import { useFilterSortStore as useFilterSort } from '@/stores/filter-sort-store';
import { useUserEvents } from '@/hooks/convex';
import { EventListSkeleton } from '@/components/skeletons';

/**
 * Client wrapper component with direct Convex hooks - Client-only pattern
 * - Uses useUserEvents hook for real-time user events data
 * - Uses filter/sort state from FilterSortProvider
 * - Real-time updates via Convex subscriptions
 */
export function EventListWrapper() {
  const { sortBy, filter } = useFilterSort();

  // Use direct Convex hook for real-time user events data
  const userEventsData = useUserEvents();

  // Handle loading/error states
  if (!userEventsData) {
    return <EventListSkeleton />;
  }

  const { userId } = userEventsData;

  // EventList fetches its own data via useUserEvents
  return <EventList userId={userId} sortBy={sortBy} filter={filter} />;
}

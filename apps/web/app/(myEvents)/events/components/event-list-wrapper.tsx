'use client';

import { EventListClient } from './event-list-client';
import { useFilterSort } from './filter-sort-provider';
import type { UserDashboardData } from '@groupi/schema';

type Event = UserDashboardData['memberships'][0]['event'];
type Membership = UserDashboardData['memberships'][0];

interface EventListWrapperProps {
  events: Event[];
  memberships: Membership[];
  userId: string;
}

/**
 * Client wrapper component that uses filter/sort state from context
 * - Receives events data from server
 * - Uses filter/sort state from FilterSortProvider
 */
export function EventListWrapper({
  events,
  memberships,
  userId,
}: EventListWrapperProps) {
  const { sortBy, filter } = useFilterSort();

  return (
    <EventListClient
      events={events}
      memberships={memberships}
      userId={userId}
      sortBy={sortBy}
      filter={filter}
    />
  );
}

'use client';

import { EventList } from './components/event-list';
import { FilterSortControls } from './components/filter-sort-controls';
import { ListPageTemplate } from '@/components/templates';

/**
 * My Events Page - Client-only architecture
 * - Auth and onboarding checks handled by AuthenticatedLayout
 * - Page only renders after auth is confirmed
 * - EventList handles its own loading state with skeleton
 * - Real-time updates via Convex subscriptions
 */
export default function MyEventsPage() {
  return (
    <ListPageTemplate title='My Events' controls={<FilterSortControls />}>
      <EventList />
    </ListPageTemplate>
  );
}

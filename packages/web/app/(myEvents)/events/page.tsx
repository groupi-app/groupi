'use client';

import { EventList } from './components/event-list';
import { FilterSortControls } from './components/filter-sort-controls';

/**
 * My Events Page - Client-only architecture
 * - Auth and onboarding checks handled by AuthenticatedLayout
 * - Page only renders after auth is confirmed
 * - EventList handles its own loading state with skeleton
 * - Real-time updates via Convex subscriptions
 */
export default function MyEventsPage() {
  return (
    <div className='container py-6 max-w-4xl'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4'>
        <h1 className='text-5xl font-heading font-medium'>My Events</h1>
        <FilterSortControls />
      </div>
      <EventList />
    </div>
  );
}

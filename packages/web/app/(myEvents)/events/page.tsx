import { EventListPageContent } from './components/event-list-page-content';
import { EventListSkeleton } from '@/components/skeletons/event-list-skeleton';
import { FilterSortControls } from './components/filter-sort-controls';
import { Suspense } from 'react';

/**
 * My Events Page - Static root for instant skeleton rendering
 * - Page root is static (no async operations) for optimal PPR
 * - All checks and redirects happen inside Suspense boundary
 * - Skeletons show immediately while checks complete
 * - Header is statically rendered (no server data needed)
 * - Filter/sort controls are statically generated (HTML in initial page load)
 * - EventListServer fetches cached data (5 min stale, 2 min revalidate)
 */
export default function MyEventsPage() {
  return (
    <div className='container py-6 max-w-4xl'>
      {/* Statically rendered header and controls - inline layout */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4'>
        <h1 className='text-5xl font-heading font-medium'>My Events</h1>
        {/* Filter and sort controls - statically generated HTML, interactive after hydration */}
        <FilterSortControls />
      </div>
      <Suspense fallback={<EventListSkeleton />}>
        <EventListPageContent />
      </Suspense>
    </div>
  );
}

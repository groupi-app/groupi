import { EventListServer } from './components/event-list-server';
import { EventListSkeleton } from '@/components/skeletons/event-list-skeleton';
import { Suspense } from 'react';

/**
 * My Events Page - Now uses cache components for optimal performance
 * - EventListServer fetches cached data (2 min TTL)
 * - Suspense provides instant loading state
 * - No prefetching needed - cache handles it
 */
export default async function MyEventsPage() {
  return (
    <div className='container py-6 max-w-4xl'>
      <Suspense fallback={<EventListSkeleton />}>
        <EventListServer />
      </Suspense>
    </div>
  );
}

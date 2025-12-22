import { EventListServer } from './event-list-server';
import { EventListSkeleton } from '@/components/skeletons/event-list-skeleton';
import { Suspense } from 'react';
import { getCachedMyEventsData, getUserId } from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { componentLogger } from '@/lib/logger';

/**
 * My Events page content component
 * Handles auth check and renders events content
 * All checks and redirects happen inside Suspense boundary for instant skeleton rendering
 */
export async function EventListPageContent() {
  // Auth check inside Suspense - redirects work via Next.js streaming meta tag
  const [authError] = await getUserId();
  if (authError) {
    componentLogger.info({}, 'Redirecting to sign-in');
    redirect('/sign-in');
  }

  // Pre-check for errors
  const [error] = await getCachedMyEventsData();
  if (error && error._tag === 'NotFoundError') {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-lg text-red-600'>User not found</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<EventListSkeleton />}>
      <EventListServer />
    </Suspense>
  );
}


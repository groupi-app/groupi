import { AvailabilityServer } from './availability-server';
import { Suspense } from 'react';
import { AvailabilityFormSkeleton } from '@/components/skeletons/availability-form-skeleton';
import {
  getUserId,
  getCachedEventHeaderData,
  getCachedEventAvailabilityData,
} from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { componentLogger } from '@/lib/logger';

/**
 * Availability page content component
 * Handles auth, header check, and renders availability content
 * All checks and redirects happen inside Suspense boundary for instant skeleton rendering
 */
export async function AvailabilityPageContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // Auth check inside Suspense - redirects work via Next.js streaming meta tag
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    componentLogger.info({ eventId }, 'Redirecting to sign-in');
    redirect('/sign-in');
  }

  // Check if event has a chosen date inside Suspense - redirects work via Next.js streaming meta tag
  const [headerError, headerData] = await getCachedEventHeaderData(eventId);
  if (!headerError && headerData?.event?.chosenDateTime) {
    componentLogger.info(
      { eventId },
      'Event has chosen date, redirecting to event page'
    );
    redirect(`/event/${eventId}`);
  }

  // Pre-check for errors
  const [error] = await getCachedEventAvailabilityData(eventId);
  if (error && error._tag === 'AuthenticationError') {
    // Shouldn't happen since we checked auth above, but handle just in case
    redirect('/sign-in');
  }

  return (
    <div className='container max-w-5xl py-4'>
      {/* Static shell - renders immediately */}
      <div className='mb-6'>
        <h1 className='text-3xl font-heading font-bold'>
          Set Your Availability
        </h1>
        <p className='text-muted-foreground mt-2'>
          Select the dates and times you are available for this event.
        </p>
      </div>

      {/* Dynamic content - wrapped in Suspense */}
      <Suspense fallback={<AvailabilityFormSkeleton />}>
        <AvailabilityServer eventId={eventId} userId={userId} />
      </Suspense>
    </div>
  );
}

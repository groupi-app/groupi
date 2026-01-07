import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AttendeesServer } from './attendees-server';
import { AttendeeListSkeleton } from '@/components/skeletons/attendee-list-skeleton';
import { Suspense } from 'react';
import {
  getUserId,
  shouldRedirectToAvailability,
  getCachedEventAttendeesData,
} from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { componentLogger } from '@/lib/logger';

/**
 * Attendees page content component
 * Handles auth, availability check, and renders attendees content
 * All checks and redirects happen inside Suspense boundary for instant skeleton rendering
 */
export async function AttendeesPageContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // Auth check inside Suspense - redirects work via Next.js streaming meta tag
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    componentLogger.debug({ eventId }, 'Redirecting to sign-in');
    redirect('/sign-in');
  }

  // Check if user should be redirected to availability page
  // Only redirects if there's an active poll (no chosen date) and user hasn't set availability
  const shouldRedirect = await shouldRedirectToAvailability(eventId);
  if (shouldRedirect === true) {
    componentLogger.debug({ eventId }, 'Redirecting to availability page');
    redirect(`/event/${eventId}/availability`);
  }

  // Pre-check for errors
  const [error] = await getCachedEventAttendeesData(eventId);
  if (error && error._tag === 'NotFoundError') {
    return (
      <div className='container max-w-4xl py-4'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Event not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className='container max-w-4xl py-4'>
      {/* Static shell - renders immediately */}
      <div className='w-max'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>Back to Event</span>
          </Button>
        </Link>
      </div>
      <div className='py-4'>
        <h1 className='text-2xl font-bold mb-4'>Attendees</h1>
        <Suspense fallback={<AttendeeListSkeleton />}>
          <AttendeesServer eventId={eventId} />
        </Suspense>
      </div>
    </div>
  );
}

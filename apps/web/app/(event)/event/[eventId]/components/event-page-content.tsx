import { EventHeaderServer } from './event-header-server';
import { MemberListServer } from './member-list-server';
import { PostFeedServer } from './post-feed-server';
import { EventHeaderSkeleton } from '@/components/skeletons/event-header-skeleton';
import { MemberListSkeleton } from '@/components/skeletons/member-list-skeleton';
import { PostFeedSkeleton } from './post-feed-skeleton';
import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import {
  getCachedEventHeaderData,
  shouldRedirectToAvailability,
  getUserId,
} from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { componentLogger } from '@/lib/logger';

/**
 * Event page content component
 * Handles auth, header data fetching, availability check, and renders event content
 * Uses "use cache: private" at component level for PPR optimization
 * All checks and redirects happen inside Suspense boundary for instant skeleton rendering
 */
export async function EventPageContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  'use cache: private';
  cacheLife({ stale: 60 }); // Prevent prerendering, enable headers() access

  const { eventId } = await params;
  componentLogger.debug({ eventId }, 'Loading event');

  // Auth check inside Suspense - redirects work via Next.js streaming meta tag
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    componentLogger.debug({ eventId }, 'Redirecting to sign-in');
    redirect('/sign-in');
  }

  // Fetch header data inside Suspense
  const [headerError, headerData] = await getCachedEventHeaderData(eventId);

  componentLogger.debug(
    {
      eventId: headerData?.event?.id,
      hasError: !!headerError,
      errorTag: headerError?._tag,
      hasData: !!headerData,
    },
    'Header data result'
  );

  if (headerError) {
    componentLogger.info(
      { eventId, errorTag: headerError._tag },
      'Handling error'
    );
    switch (headerError._tag) {
      case 'NotFoundError':
        return (
          <div className='container pt-6 pb-24'>
            <div className='text-center py-8'>
              <h1 className='text-2xl font-bold text-red-600'>
                Event not found
              </h1>
            </div>
          </div>
        );
      case 'AuthenticationError':
        componentLogger.debug({ eventId }, 'Redirecting to sign-in');
        redirect('/sign-in');
      // eslint-disable-next-line no-fallthrough
      case 'UnauthorizedError':
        return (
          <div className='container pt-6 pb-24'>
            <div className='text-center py-8'>
              <h1 className='text-2xl font-bold text-red-600'>
                You are not a member of this event
              </h1>
            </div>
          </div>
        );
      default:
        componentLogger.error(
          { eventId, error: headerError },
          'Unexpected error'
        );
        return (
          <div className='container pt-6 pb-24'>
            <div className='text-center py-8'>
              <h1 className='text-2xl font-bold text-red-600'>
                An unexpected error occurred
              </h1>
            </div>
          </div>
        );
    }
  }

  if (!headerData) {
    componentLogger.error({ eventId }, 'No header data returned');
    return (
      <div className='container pt-6 pb-24'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>
            Failed to load event data
          </h1>
        </div>
      </div>
    );
  }

  // Check if user should be redirected to availability page
  // Only redirects if there's an active poll (no chosen date) and user hasn't set availability
  try {
    componentLogger.debug(
      { eventId },
      'Checking if redirect to availability is needed'
    );
    const shouldRedirect = await shouldRedirectToAvailability(eventId);
    componentLogger.debug(
      { eventId, shouldRedirect },
      'Availability redirect check result'
    );
    if (shouldRedirect === true) {
      componentLogger.debug({ eventId }, 'Redirecting to availability page');
      redirect(`/event/${eventId}/availability`);
    }
  } catch (error) {
    // Rethrow redirect errors - they're not actual errors
    if (isRedirectError(error)) {
      throw error;
    }
    // If availability check fails, log but don't block rendering
    componentLogger.error(
      { eventId, error },
      'Error checking availability redirect'
    );
  }

  componentLogger.debug({ eventId }, 'Rendering child components');
  return (
    <div className='container pt-6 pb-24 space-y-5'>
      <Suspense fallback={<EventHeaderSkeleton />}>
        <EventHeaderServer eventId={eventId} />
      </Suspense>
      <div className='max-w-4xl mx-auto flex flex-col gap-4'>
        <Suspense fallback={<MemberListSkeleton />}>
          <MemberListServer eventId={eventId} />
        </Suspense>
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeedServer eventId={eventId} />
        </Suspense>
      </div>
    </div>
  );
}

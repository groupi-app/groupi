import { AvailabilityContent } from './components/availability-content';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { pageLogger } from '@/lib/logger';
import { prefetchEventAvailabilityPageData } from '@groupi/hooks/server';
import { HydrationBoundary } from '@tanstack/react-query';

export default async function EventAvailabilityPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  // Validate session server-side
  const [authError, userId] = await getCurrentUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch event availability page data
    const dehydratedState = await prefetchEventAvailabilityPageData(eventId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <AvailabilityContent eventId={eventId} userId={userId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event availability page:');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>
            An error occurred while loading availability data.
          </p>
        </div>
      </div>
    );
  }
}

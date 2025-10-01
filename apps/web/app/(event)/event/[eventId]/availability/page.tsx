import { AvailabilityContent } from './components/availability-content';
import { pageLogger } from '@/lib/logger';
import { prefetchEventAvailabilityPageData } from '@groupi/hooks/server';
import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export default async function EventAvailabilityPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch event availability page data
    const dehydratedState = await prefetchEventAvailabilityPageData(
      eventId,
      userId
    );

    return (
      <HydrationBoundary state={dehydratedState}>
        <AvailabilityContent eventId={eventId} userId={userId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error('Error in event availability page:', { error });
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

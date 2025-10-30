import { EditEventContent } from './components/edit-event-content';
import { prefetchEventEditPageData } from '@groupi/hooks/server';
import { pageLogger } from '@/lib/logger';
import { HydrationBoundary } from '@tanstack/react-query';
import { GoogleMapsScript } from '@/components/google-maps-script';
import { env } from '@/env.mjs';

export default async function EventEditPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  try {
    // Prefetch event edit page data
    const dehydratedState = await prefetchEventEditPageData(eventId);

    return (
      <>
        <HydrationBoundary state={dehydratedState}>
          <EditEventContent eventId={eventId} />
        </HydrationBoundary>
        <GoogleMapsScript apiKey={env.GOOGLE_API_KEY} />
      </>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event edit page:');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading the page.</p>
        </div>
      </div>
    );
  }
}

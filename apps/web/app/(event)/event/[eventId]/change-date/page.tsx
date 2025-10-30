import { ChangeDateContent } from './components/change-date-content';
import { pageLogger } from '@/lib/logger';
import { prefetchEventChangeDatePageData } from '@groupi/hooks/server';
import { HydrationBoundary } from '@tanstack/react-query';

export default async function EventChangeDatePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  try {
    // Prefetch event change date page data
    const dehydratedState = await prefetchEventChangeDatePageData(eventId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <ChangeDateContent eventId={eventId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event change date page:');
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

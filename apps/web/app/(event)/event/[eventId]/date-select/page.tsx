import { DateSelectContent } from './components/date-select-content';
import { prefetchEventDateSelectPageData } from '@groupi/hooks/server';
import { pageLogger } from '@/lib/logger';
import { HydrationBoundary } from '@tanstack/react-query';

export default async function EventDateSelectPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  try {
    // Prefetch event date select page data
    const dehydratedState = await prefetchEventDateSelectPageData(eventId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <DateSelectContent eventId={eventId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event date select page:');
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

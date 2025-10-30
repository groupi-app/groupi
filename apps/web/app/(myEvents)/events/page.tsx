import { EventList } from './components/event-list';
import { prefetchMyEventsPageData } from '@groupi/hooks/server';
import { getCurrentUserId } from '@groupi/services';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { pageLogger } from '@/lib/logger';

export default async function MyEventsPage() {
  const [authError, userId] = await getCurrentUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch my events data
    // Services will get userId internally via getCurrentUserId()
    const dehydratedState = await prefetchMyEventsPageData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container py-6 max-w-4xl'>
          <EventList />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in my events page');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading your events.</p>
        </div>
      </div>
    );
  }
}

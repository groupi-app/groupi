import { EventList } from './components/event-list';
import { prefetchMyEventsPageData } from '@groupi/hooks/server';
import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export default async function MyEventsPage() {
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch my events data
    const dehydratedState = await prefetchMyEventsPageData(userId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container py-6 max-w-4xl'>
          <EventList />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    console.error('Error in my events page:', error);
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
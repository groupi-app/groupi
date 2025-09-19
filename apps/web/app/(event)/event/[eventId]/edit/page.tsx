import { EditEventContent } from './components/edit-event-content';
import { prefetchEventEditPageData } from '@groupi/hooks/server';
import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { GoogleMapsScript } from '@/components/google-maps-script';

export default async function EventEditPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch event edit page data
    const dehydratedState = await prefetchEventEditPageData(eventId, userId);

    return (
      <>
        <HydrationBoundary state={dehydratedState}>
          <EditEventContent eventId={eventId} />
        </HydrationBoundary>
        <GoogleMapsScript />
      </>
    );
  } catch (error) {
    console.error('Error in event edit page:', error);
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

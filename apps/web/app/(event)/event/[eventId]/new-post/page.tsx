import { NewPostContent } from './components/new-post-content';
import { pageLogger } from '@/lib/logger';
import { prefetchEventNewPostPageData } from '@groupi/hooks/server';
import { HydrationBoundary } from '@tanstack/react-query';

export default async function EventNewPostPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  try {
    // Prefetch event new post page data
    const dehydratedState = await prefetchEventNewPostPageData(eventId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <NewPostContent eventId={eventId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event new post page:');
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

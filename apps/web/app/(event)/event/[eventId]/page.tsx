import { EventHeader } from './components/event-header';
import { MemberList } from './components/member-list';
import { NewPostButton } from './components/new-post-button';
import { PostFeed } from './components/post-feed';
import { prefetchEventPageComponents } from '@groupi/hooks/server';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { HydrationBoundary } from '@tanstack/react-query';
import { pageLogger } from '@/lib/logger';

export default async function EventPage(props: {
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
    // Prefetch all component data in parallel
    // Services will get userId internally via getCurrentUserId()
    const dehydratedState = await prefetchEventPageComponents(eventId);

    // Marking notifications as read has been removed in this path

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container pt-6 pb-24 space-y-5'>
          <EventHeader eventId={eventId} />
          <div className='max-w-4xl mx-auto flex flex-col gap-4'>
            <MemberList eventId={eventId} />
            <PostFeed eventId={eventId} />
          </div>
          <NewPostButton />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error, eventId }, 'Error in event page');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading the event.</p>
        </div>
      </div>
    );
  }
}

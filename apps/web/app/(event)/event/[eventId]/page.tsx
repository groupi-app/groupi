import { EventHeaderServer } from './components/event-header-server';
import { MemberListServer } from './components/member-list-server';
import { NewPostButton } from './components/new-post-button';
import { PostFeedServer } from './components/post-feed-server';
import { EventHeaderSkeleton } from '@/components/skeletons/event-header-skeleton';
import { MemberListSkeleton } from '@/components/skeletons/member-list-skeleton';
import { PostFeedSkeleton } from '@/components/skeletons/post-feed-skeleton';
import { Suspense } from 'react';

/**
 * Event Detail Page - Now uses cache components for optimal performance
 * - EventHeaderServer fetches cached header data (5 min TTL)
 * - MemberListServer fetches cached member data (2 min TTL)
 * - PostFeedServer fetches cached posts (30 sec TTL)
 * - Each component wrapped in Suspense for granular loading states
 * - No prefetching needed - cache handles it
 */
export default async function EventPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return (
    <div className='container pt-6 pb-24 space-y-5'>
      <Suspense fallback={<EventHeaderSkeleton />}>
        <EventHeaderServer eventId={eventId} />
      </Suspense>
      <div className='max-w-4xl mx-auto flex flex-col gap-4'>
        <Suspense fallback={<MemberListSkeleton />}>
          <MemberListServer eventId={eventId} />
        </Suspense>
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeedServer eventId={eventId} />
        </Suspense>
      </div>
      <NewPostButton />
    </div>
  );
}

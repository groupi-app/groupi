import { EventPageContent } from './components/event-page-content';
import { NewPostButton } from '@/components/new-post-button';
import { EventHeaderSkeleton } from '@/components/skeletons/event-header-skeleton';
import { MemberListSkeleton } from '@/components/skeletons/member-list-skeleton';
import { PostFeedSkeleton } from './components/post-feed-skeleton';
import { Suspense } from 'react';

/**
 * Event Detail Page - Static root for instant skeleton rendering
 * - Page root is static (no async operations) for optimal PPR
 * - All checks and redirects happen inside Suspense boundary
 * - Skeletons show immediately while checks complete
 * - EventHeaderServer fetches cached header data (5 min TTL)
 * - MemberListServer fetches cached member data (2 min TTL)
 * - PostFeedServer fetches cached posts (30 sec TTL)
 * - Each component wrapped in Suspense for granular loading states
 */
export default function EventPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <>
      <Suspense
        fallback={
          <div className='container pt-6 pb-24 space-y-5'>
            <EventHeaderSkeleton />
            <div className='mx-auto flex flex-col gap-4 max-w-4xl'>
              <MemberListSkeleton />
              <PostFeedSkeleton />
            </div>
          </div>
        }
      >
        <EventPageContent params={props.params} />
      </Suspense>
      <NewPostButton />
    </>
  );
}

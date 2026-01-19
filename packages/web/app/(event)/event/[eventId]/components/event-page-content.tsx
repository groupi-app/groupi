import { EventHeaderServer } from './event-header-server';
import { MemberListServer } from './member-list-server';
import { PostFeedServer } from './post-feed-server';
import { EventHeaderSkeleton } from '@/components/skeletons/event-header-skeleton';
import { MemberListSkeleton } from '@/components/skeletons/member-list-skeleton';
import { PostFeedSkeleton } from './post-feed-skeleton';
import { Suspense } from 'react';

/**
 * Event page content component - Fully migrated to Convex
 * - All authentication handled by Convex auth system in client components
 * - All data fetching handled by Convex hooks in child components
 * - Real-time updates via Convex subscriptions
 * - Error handling and loading states managed by client components
 * - Server component just provides structure and layout
 */
export async function EventPageContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // Simple server-rendered structure - all data fetching happens in client components
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
    </div>
  );
}

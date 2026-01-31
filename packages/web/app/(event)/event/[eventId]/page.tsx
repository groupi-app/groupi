'use client';

import { EventHeader } from './components/event-header';
import { MemberList } from './components/member-list';
import { PostFeed } from './components/post-feed';
import { NewPostButton } from '@/components/new-post-button';
import { useEventData } from './context';
import { EventPageSkeleton } from '@/components/skeletons';

/**
 * Event Detail Page - Client-only architecture
 * - Data provided by EventDataProvider in layout (no fetching here)
 * - All data is pre-loaded, so no skeleton flashes between pages
 * - Real-time updates via Convex subscriptions in provider
 */
export default function EventPage() {
  const { headerData, membersData, postFeedData, isLoading } = useEventData();

  // Show skeleton while core data is loading
  if (isLoading || !headerData || !membersData || !postFeedData) {
    return <EventPageSkeleton />;
  }

  return (
    <>
      <div className='container pt-6 pb-24 space-y-5'>
        <EventHeader data={headerData} />
        <div className='max-w-4xl mx-auto flex flex-col gap-4'>
          <MemberList data={membersData} />
          <PostFeed data={postFeedData} />
        </div>
      </div>
      <NewPostButton />
    </>
  );
}

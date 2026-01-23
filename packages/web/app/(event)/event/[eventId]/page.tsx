'use client';

import { use } from 'react';
import { EventHeaderClient } from './components/event-header-client';
import { MemberListClient } from './components/member-list-client';
import { PostFeedClient } from './components/post-feed-client';
import { NewPostButton } from '@/components/new-post-button';

/**
 * Event Detail Page - Client-only architecture
 * - Auth and onboarding checks handled by AuthenticatedLayout
 * - Event membership check handled by layout
 * - Each component handles its own loading state with skeleton
 * - Real-time updates via Convex subscriptions
 */
export default function EventPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);

  return (
    <>
      <div className='container pt-6 pb-24 space-y-5'>
        <EventHeaderClient eventId={eventId} />
        <div className='max-w-4xl mx-auto flex flex-col gap-4'>
          <MemberListClient eventId={eventId} />
          <PostFeedClient eventId={eventId} />
        </div>
      </div>
      <NewPostButton />
    </>
  );
}

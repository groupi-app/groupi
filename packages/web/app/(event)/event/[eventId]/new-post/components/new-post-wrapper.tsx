'use client';

import { NewPostContent } from './new-post-content';
import { useEventHeader, useCurrentUser } from '@/hooks/convex';
import { PostEditorSkeleton } from '@/components/skeletons';
import { Id } from '@/convex/_generated/dataModel';

interface NewPostWrapperProps {
  eventId: string;
}

/**
 * New Post Wrapper - Client-only architecture
 * - Uses Convex hooks for real-time data
 * - Renders new post content when data is ready
 */
export function NewPostWrapper({ eventId }: NewPostWrapperProps) {
  const eventData = useEventHeader(eventId as Id<'events'>);
  const currentUser = useCurrentUser();

  // Loading state
  if (!eventData || !currentUser) {
    return (
      <div className='container pt-6'>
        <PostEditorSkeleton />
      </div>
    );
  }

  return <NewPostContent eventId={eventId} />;
}

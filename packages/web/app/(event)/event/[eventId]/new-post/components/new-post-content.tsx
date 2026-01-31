'use client';

import { Editor } from '../../post/[postId]/components/editor';
import { PostEditorSkeleton } from '@/components/skeletons';
import { useEventData } from '../../context';

export function NewPostContent({ eventId }: { eventId: string }) {
  // Use context data (pre-fetched at layout level)
  const {
    currentUser: user,
    headerData: eventData,
    isCurrentUserLoading,
    isHeaderLoading,
  } = useEventData();

  if (isCurrentUserLoading || isHeaderLoading) {
    return (
      <div className='container pt-6'>
        <PostEditorSkeleton />
      </div>
    );
  }

  if (user === null) {
    return <div>Please sign in to create posts</div>;
  }

  if (eventData === null || eventData === undefined) {
    return <div>Event not found</div>;
  }

  // Check if user is a member of this event
  if (!eventData.userMembership) {
    return <div>You are not a member of this event</div>;
  }

  return (
    <div className='container pt-6'>
      <Editor eventId={eventId} />
    </div>
  );
}

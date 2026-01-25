'use client';

import { useEventHeader, useCurrentUser } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { Editor } from '../../../../../(post)/post/[postId]/components/editor';
import { PostEditorSkeleton } from '@/components/skeletons';

export function NewPostContent({ eventId }: { eventId: string }) {
  const user = useCurrentUser();
  const eventData = useEventHeader(eventId as Id<'events'>);

  if (user === undefined || eventData === undefined) {
    return (
      <div className='container pt-6'>
        <PostEditorSkeleton />
      </div>
    );
  }

  if (user === null) {
    return <div>Please sign in to create posts</div>;
  }

  if (eventData === null) {
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

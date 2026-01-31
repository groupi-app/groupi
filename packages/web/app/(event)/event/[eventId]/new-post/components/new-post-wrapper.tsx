'use client';

import { NewPostContent } from './new-post-content';
import { PostEditorSkeleton } from '@/components/skeletons';
import { useEventData } from '../../context';

interface NewPostWrapperProps {
  eventId: string;
}

/**
 * New Post Wrapper - Client-only architecture
 * - Uses EventDataProvider context for data (pre-fetched at layout level)
 * - Renders new post content when data is ready
 */
export function NewPostWrapper({ eventId }: NewPostWrapperProps) {
  // Use context data (pre-fetched at layout level)
  const {
    headerData: eventData,
    currentUser,
    isHeaderLoading,
    isCurrentUserLoading,
  } = useEventData();

  // Loading state
  if (isHeaderLoading || isCurrentUserLoading || !eventData || !currentUser) {
    return (
      <div className='container pt-6'>
        <PostEditorSkeleton />
      </div>
    );
  }

  return <NewPostContent eventId={eventId} />;
}

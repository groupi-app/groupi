'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewPostContent } from './new-post-content';
import { PostEditorSkeleton } from '@/components/skeletons';
import { useEventData } from '../../context';
import { canCreatePosts } from '@/lib/event-permissions';

interface NewPostWrapperProps {
  eventId: string;
}

export function NewPostWrapper({ eventId }: NewPostWrapperProps) {
  const router = useRouter();
  const {
    headerData: eventData,
    currentUser,
    isHeaderLoading,
    isCurrentUserLoading,
  } = useEventData();

  useEffect(() => {
    if (eventData) {
      const userRole = eventData.userMembership?.role;
      const perms = eventData.permissions;
      if (userRole && perms && !canCreatePosts(userRole, perms)) {
        router.replace(`/event/${eventId}`);
      }
    }
  }, [eventData, eventId, router]);

  if (isHeaderLoading || isCurrentUserLoading || !eventData || !currentUser) {
    return (
      <div className='container pt-6'>
        <PostEditorSkeleton />
      </div>
    );
  }

  return <NewPostContent eventId={eventId} />;
}

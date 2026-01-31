'use client';

import { ReplyList } from './reply-list';
import { ReplyListSkeleton } from '@/components/skeletons';
import { useRef } from 'react';
import { useEventData } from '../../../context';

/**
 * Client component that uses EventDataProvider context for post and replies data
 */
export default function ReplyFeed({ postId }: { postId: string }) {
  // Use context data (pre-fetched at layout level)
  const {
    currentUser: user,
    postDetailData: postData,
    repliesData,
    isCurrentUserLoading,
    isPostLoading,
    isRepliesLoading,
  } = useEventData();
  const newestReplyRef = useRef<HTMLDivElement>(null);

  if (isCurrentUserLoading || isPostLoading || isRepliesLoading) {
    return <ReplyListSkeleton />;
  }

  if (user === null) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        Please sign in to view replies
      </div>
    );
  }

  if (postData === null || postData === undefined) {
    return <div>Error loading replies</div>;
  }

  const { post, userMembership } = postData;
  const replies = repliesData?.replies || [];

  if (replies.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No replies yet. Be the first to reply!
      </div>
    );
  }

  // Get event datetime from the post's event
  const eventDateTime = post.event?.chosenDateTime
    ? new Date(post.event.chosenDateTime)
    : null;

  return (
    <ReplyList
      userId={user.user.id}
      postId={postId}
      userRole={userMembership.role}
      eventDateTime={eventDateTime}
      newestReplyRef={newestReplyRef}
    />
  );
}

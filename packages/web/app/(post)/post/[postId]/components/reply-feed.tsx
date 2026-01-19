'use client';

import { usePostDetail, useCurrentUser, usePostReplies } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { ReplyFeedClient } from './reply-feed-client';
import { ReplyListSkeleton } from '@/components/skeletons';
import { useRef } from 'react';

/**
 * Client component that uses Convex hooks for real-time replies data
 */
export default function ReplyFeed({ postId }: { postId: string }) {
  const user = useCurrentUser();
  const postData = usePostDetail(postId as Id<"posts">);
  const repliesData = usePostReplies(postId as Id<"posts">);
  const newestReplyRef = useRef<HTMLDivElement>(null);

  if (user === undefined || postData === undefined || repliesData === undefined) {
    return <ReplyListSkeleton />;
  }

  if (user === null) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        Please sign in to view replies
      </div>
    );
  }

  if (postData === null) {
    return <div>Error loading replies</div>;
  }

  const { post, userMembership } = postData;
  const { replies } = repliesData;

  if (replies.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No replies yet. Be the first to reply!
      </div>
    );
  }

  // Get event datetime from the post's event
  const eventDateTime = post.event?.chosenDateTime ? new Date(post.event.chosenDateTime) : null;

  return (
    <ReplyFeedClient
      userId={user.user.id}
      postId={postId}
      userRole={userMembership.role}
      eventDateTime={eventDateTime}
      newestReplyRef={newestReplyRef}
    />
  );
}

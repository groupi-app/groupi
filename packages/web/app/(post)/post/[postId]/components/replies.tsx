'use client';

import { usePostDetail, useCurrentUser, usePostReplies } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { RepliesClient } from './replies-client';
import { ReplyListSkeleton, ReplyFormSkeleton } from '@/components/skeletons';

/**
 * Client component that uses Convex hooks for real-time post and replies data
 */
export function Replies({ postId }: { postId: string }) {
  const user = useCurrentUser();
  const postData = usePostDetail(postId as Id<"posts">);
  const repliesData = usePostReplies(postId as Id<"posts">);

  if (user === undefined || postData === undefined || repliesData === undefined) {
    return (
      <div className='space-y-6'>
        <ReplyFormSkeleton />
        <ReplyListSkeleton />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>Please sign in to view replies</p>
      </div>
    );
  }

  // Post was deleted or not found - don't show replies section
  if (postData === null) {
    return null;
  }

  const { post, userMembership } = postData;
  const { replies } = repliesData;

  return (
    <RepliesClient
      postId={postId as Id<"posts">}
      userId={user.person.id}
      replies={replies}
      userMembership={userMembership}
      post={post}
    />
  );
}

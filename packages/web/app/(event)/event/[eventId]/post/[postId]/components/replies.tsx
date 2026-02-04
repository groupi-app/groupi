'use client';

import { Id } from '@/convex/_generated/dataModel';
import { RepliesSection } from './replies-section';
import { ReplyListSkeleton, ReplyFormSkeleton } from '@/components/skeletons';
import { useEventData } from '../../../context';

/**
 * Client component that displays replies for a post.
 * Uses EventDataProvider context for post and replies data (pre-fetched at layout level).
 */
export function Replies({ postId }: { postId: string }) {
  // Get data from context (pre-fetched at layout level)
  const {
    currentUser: user,
    postDetailData: postData,
    repliesData,
    isCurrentUserLoading,
    isPostLoading,
    isRepliesLoading,
  } = useEventData();

  if (isCurrentUserLoading || isPostLoading || isRepliesLoading) {
    return (
      <div className='flex flex-col mt-6'>
        {/* Divider matching RepliesSection */}
        <div className='border-t border-border mb-6'></div>
        <div className='flex flex-col gap-4 -mx-4 sm:mx-0'>
          <ReplyListSkeleton />
          <ReplyFormSkeleton />
        </div>
      </div>
    );
  }

  if (!user || !user.person) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>Please sign in to view replies</p>
      </div>
    );
  }

  // Post was deleted or not found - don't show replies section
  if (!postData) {
    return null;
  }

  const { post, userMembership } = postData;
  const replies = repliesData?.replies || [];

  return (
    <RepliesSection
      postId={postId as Id<'posts'>}
      userId={user.person.id}
      replies={replies}
      userMembership={userMembership}
      post={post}
    />
  );
}

import { getCachedPostWithReplies, getUserId } from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { RepliesClient } from './replies-client';

/**
 * Server component that fetches cached replies
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 */
export async function Replies({ postId }: { postId: string }) {
  'use cache: private';

  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error || !postData) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading replies</p>
      </div>
    );
  }

  const { post, userMembership } = postData;

  if (!post) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading replies</p>
      </div>
    );
  }

  const replies = post.replies || [];

  return (
    <RepliesClient
      postId={postId}
      userId={userId}
      replies={replies}
      userMembership={userMembership}
      post={post}
    />
  );
}

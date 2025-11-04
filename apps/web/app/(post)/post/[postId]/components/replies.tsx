import { getCachedPostWithReplies, getUserId } from '@groupi/services';
import { ReplyFeedClient } from './reply-feed-client';
import ReplyForm from './reply-form';
import { redirect } from 'next/navigation';

/**
 * Server component that fetches cached replies
 * Dynamic rendering - data fetching happens at request time
 */
export async function Replies({ postId }: { postId: string }) {
  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading replies</p>
      </div>
    );
  }

  const { post, userMembership } = postData;
  const replies = post.replies || [];

  return (
    <div className='flex flex-col my-12'>
      <h1 className='text-2xl font-heading font-medium mb-4'>Replies</h1>
      <div className='flex flex-col gap-4'>
        <ReplyForm postId={postId} userId={userId} />
        <ReplyFeedClient
          replies={replies}
          userMembership={userMembership}
          userId={userId}
          post={post}
        />
      </div>
    </div>
  );
}

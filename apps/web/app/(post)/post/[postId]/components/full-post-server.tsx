import {
  getCachedPostWithReplies,
  getUserId,
  shouldRedirectToAvailability,
} from '@groupi/services/server';
import { FullPostClient } from './full-post-client';
import { redirect } from 'next/navigation';

/**
 * Server component that fetches cached post data
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 */
export async function FullPostServer({ postId }: { postId: string }) {
  'use cache: private';

  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return (
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold text-red-600'>Post not found</h1>
          </div>
        );
      case 'UnauthorizedError':
        return (
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold text-red-600'>
              You are not a member of this event
            </h1>
          </div>
        );
      default:
        return (
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold text-red-600'>
              An unexpected error occurred
            </h1>
          </div>
        );
    }
  }

  const { post, userMembership } = postData;

  // Check if user should be redirected to availability page
  // Only redirects if there's an active poll (no chosen date) and user hasn't set availability
  const shouldRedirect = await shouldRedirectToAvailability(post.eventId);
  if (shouldRedirect === true) {
    redirect(`/event/${post.eventId}/availability`);
  }

  return (
    <FullPostClient
      post={post}
      userMembership={userMembership}
      userId={userId}
    />
  );
}

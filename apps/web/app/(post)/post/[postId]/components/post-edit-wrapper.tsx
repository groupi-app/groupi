'use client';

import { usePostDetail } from '@groupi/hooks';
import { Editor } from './editor';

export function PostEditWrapper({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  const { data, isLoading } = usePostDetail(postId);

  if (isLoading || !data) {
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading post...</div>
        </div>
      </div>
    );
  }

  const [error, postData] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'PostNotFoundError':
        errorMessage = 'Post not found';
        break;
      case 'PostUserNotMemberError':
        errorMessage = 'You are not a member of this event';
        break;
      default:
        errorMessage = 'Failed to load post data';
    }

    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const { post } = postData;
  const { title, content, id, author, event } = post;

  if (author.id !== userId) {
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>You do not have permission to edit this post.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container pt-6'>
      <Editor eventId={event.id} postData={{ title, content, id }} />
    </div>
  );
}

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
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Post not found</div>;
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Error loading post</div>;
    }
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

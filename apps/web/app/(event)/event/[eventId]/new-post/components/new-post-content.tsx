'use client';

import { useEventNewPost } from '@groupi/hooks';
import { Editor } from '../../../../../(post)/post/[postId]/components/editor';

export function NewPostContent({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventNewPost(eventId);

  if (isLoading || !data) {
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  const [error] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'NotFoundError':
        errorMessage = 'Event not found';
        break;
      case 'UnauthorizedError':
        errorMessage = 'You are not a member of this event';
        break;
      case 'DatabaseError':
        errorMessage = 'Failed to load event data';
        break;
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

  return (
    <div className='container pt-6'>
      <Editor eventId={eventId} />
    </div>
  );
}

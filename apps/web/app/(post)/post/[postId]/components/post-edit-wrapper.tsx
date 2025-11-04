import { getCachedPostWithReplies } from '@groupi/services';
import { Editor } from './editor';
import { redirect } from 'next/navigation';

export async function PostEditWrapper({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Post not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
        // eslint-disable-next-line no-fallthrough
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

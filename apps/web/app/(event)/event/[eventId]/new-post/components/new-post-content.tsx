import { getCachedEventNewPostPageData } from '@groupi/services/server';
import { Editor } from '../../../../../(post)/post/[postId]/components/editor';
import { redirect } from 'next/navigation';

export async function NewPostContent({ eventId }: { eventId: string }) {
  const [error] = await getCachedEventNewPostPageData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');

      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Failed to load event data</div>;
    }
  }

  return (
    <div className='container pt-6'>
      <Editor eventId={eventId} />
    </div>
  );
}

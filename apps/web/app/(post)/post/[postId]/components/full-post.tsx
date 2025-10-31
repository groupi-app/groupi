import { getCachedPostWithReplies } from '@groupi/services';
import { FullPostClient } from './full-post-client';
import { redirect } from 'next/navigation';

export async function FullPost({ postId }: { postId: string }) {
  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Post not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>An unexpected error occurred</div>;
    }
  }

  const { post, userMembership } = postData;

  return (
    <FullPostClient
      post={post}
      userMembership={userMembership}
      userId={post.authorId}
    />
  );
}

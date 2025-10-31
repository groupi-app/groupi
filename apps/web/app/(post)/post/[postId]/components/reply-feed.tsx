import { getCachedPostWithReplies } from '@groupi/services';
import { ReplyFeedClient } from './reply-feed-client';
import { redirect } from 'next/navigation';

export default async function ReplyFeed({ postId }: { postId: string }) {
  const [error, postData] = await getCachedPostWithReplies(postId);

  if (error) {
    switch (error._tag) {
      case 'AuthenticationError':
        redirect('/sign-in');
      default:
        return <div>Error loading replies</div>;
    }
  }

  const { post, userMembership } = postData;
  const replies = post.replies || [];

  if (replies.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No replies yet. Be the first to reply!
      </div>
    );
  }

  return (
    <ReplyFeedClient
      replies={replies}
      userId={post.authorId}
      userMembership={userMembership}
      post={post}
    />
  );
}

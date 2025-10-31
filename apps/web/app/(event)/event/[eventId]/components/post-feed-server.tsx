import { getCachedPostFeedData } from '@groupi/services';
import { PostFeedClient } from './post-feed-client';

/**
 * Server component that fetches cached post feed data
 * Uses "use cache" with short TTL (30 seconds) due to frequent updates
 */
export async function PostFeedServer({ eventId }: { eventId: string }) {
  const [error, postFeedData] = await getCachedPostFeedData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        return <div>User not found</div>;
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Error loading posts</div>;
    }
  }

  const posts = postFeedData.event.posts || [];

  // Pass static data to client component
  return <PostFeedClient posts={posts} event={postFeedData.event} />;
}

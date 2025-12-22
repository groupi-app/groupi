import { getCachedPostFeedData } from '@groupi/services/server';
import { getUserId } from '@groupi/services/server';
import { PostFeedClient } from './post-feed-client';
import { componentLogger } from '@/lib/logger';

/**
 * Server component that fetches cached post feed data
 * Uses "use cache" with short TTL (30 seconds) due to frequent updates
 */
export async function PostFeedServer({ eventId }: { eventId: string }) {
  'use cache: private';
  
  try {
    componentLogger.debug({ eventId }, 'Fetching post feed');

    const [authError, userId] = await getUserId();
    const [error, postFeedData] = await getCachedPostFeedData(eventId);

    if (error) {
      componentLogger.error({ eventId, errorTag: error._tag, error }, 'Error fetching post feed');
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

    if (authError || !userId) {
      componentLogger.error({ eventId, authError }, 'Auth error or no userId');
      return <div>User not found</div>;
    }

    if (!postFeedData) {
      componentLogger.error({ eventId }, 'No post feed data returned');
      return <div>Failed to load posts</div>;
    }

    const posts = postFeedData.event.posts || [];
    componentLogger.debug({ eventId, postCount: posts.length }, 'Rendering PostFeedClient');

    // Pass static data to client component
    return (
      <PostFeedClient
        posts={posts}
        event={postFeedData.event}
        userId={userId}
        userRole={postFeedData.userMembership.role}
      />
    );
  } catch (error) {
    componentLogger.error({ eventId, error }, 'Caught error');
    return <div>An error occurred while loading posts</div>;
  }
}

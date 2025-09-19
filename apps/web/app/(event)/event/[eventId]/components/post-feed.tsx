'use client';

import { PostCard } from '../../../../(post)/post/[postId]/components/post-card';
import { usePostFeed } from '@groupi/hooks';
import { LayoutGroup, motion } from 'framer-motion';

export function PostFeed({ eventId }: { eventId: string }) {
  const { data, isLoading } = usePostFeed(eventId);

  if (isLoading || !data) {
    return <div>Loading posts...</div>;
  }

  const [error, postData] = data;

  if (error) {
    switch (error._tag) {
      case 'EventNotFoundError':
        return <div>Event not found</div>;
      case 'EventUserNotFoundError':
        return <div>User not found</div>;
      case 'EventUserNotMemberError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Error loading posts</div>;
    }
  }

  // If error is null, postData is guaranteed to exist

  const posts = postData.event?.posts || [];
  const eventDateTime = postData.event?.chosenDateTime;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <h2 className='text-xl font-heading font-medium'>Posts</h2>
      {posts.length > 0 ? (
        <motion.div
          variants={container}
          initial='hidden'
          animate='show'
          className='w-full flex flex-col items-center gap-3 py-2'
        >
          <LayoutGroup>
            {posts
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
              )
              .map(post => (
                <motion.div
                  layout
                  variants={item}
                  key={post.id}
                  className='w-full'
                >
                  {/* @ts-expect-error: Temporary fix - post data structure needs to be updated */}
                  <PostCard postData={post} eventDateTime={eventDateTime} />
                </motion.div>
              ))}
          </LayoutGroup>
        </motion.div>
      ) : (
        <h1 className='font-heading text-lg mt-4'>No posts yet!</h1>
      )}
    </div>
  );
}

'use client';

import { PostCard } from '../../../../(post)/post/[postId]/components/post-card';
import type { PostFeedData } from '@groupi/schema/data';
import { LayoutGroup, motion } from 'framer-motion';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { useState } from 'react';

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

type Post = PostFeedData['event']['posts'][0];
type Event = PostFeedData['event'];

interface PostFeedClientProps {
  posts: Post[];
  event: Event;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Syncs with realtime database changes for live updates
 */
export function PostFeedClient({
  posts: initialPosts,
  event,
}: PostFeedClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const eventDateTime = undefined as unknown as Date | null;

  // Sync with realtime post changes
  useRealtimeSync({
    channel: `event-${event.id}-posts`,
    table: 'Post',
    filter: `eventId=eq.${event.id}`,
    onInsert: payload => {
      // Optimistically add new post
      setPosts(prev => [payload.new as Post, ...prev]);
    },
    onUpdate: payload => {
      // Optimistically update existing post
      setPosts(prev =>
        prev.map(p => (p.id === payload.new.id ? (payload.new as Post) : p))
      );
    },
    onDelete: payload => {
      // Optimistically remove deleted post
      setPosts(prev => prev.filter(p => p.id !== payload.old.id));
    },
    refreshOnChange: true, // Also refresh cache in background
  });

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
                  <PostCard
                    postData={{ ...post, event }}
                    eventDateTime={eventDateTime}
                  />
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
